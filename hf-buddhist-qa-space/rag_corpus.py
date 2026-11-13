#!/usr/bin/env python3
"""
hf-buddhist-qa-space/rag_corpus.py

Server-Side Buddhist Canon & 12-Database Hybrid RAG Engine for Sarva-Dhāraṇī-Kośa.
Connects the Dharmamitra `buddhist-nlp/mitra-qwen35-it` model directly to the
website's cloud corpus on Hugging Face Hub (`bhrum108/sarva-dharani-kosa-tts`):
  1. Curated + GRETIL + Global 12-Database entries (`DB1`–`DB12`, 2,482+ works)
  2. Taishō Esoteric Canon index (`T18`–`T21`, 614 scriptures)
  3. Full CBETA 27-Collection Canon (`canon/catalog.json.gz` + on-demand `cbeta/{col}/{id}.json.gz`)
  4. Optional cross-lingual semantic reranking via `buddhist-nlp/mitra-qwen35-2b-embedder`
"""
from __future__ import annotations

import gzip
import json
import math
import os
import re
import threading
import unicodedata
import urllib.request
from pathlib import Path
from typing import Any

CORPUS_REPO_BASE = os.environ.get(
    "SARVA_CORPUS_CDN_BASE",
    "https://huggingface.co/bhrum108/sarva-dharani-kosa-tts/resolve/main",
).rstrip("/")

CACHE_DIR = Path(os.environ.get("SARVA_QA_CACHE_DIR", "/tmp/sarva-qa-corpus"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# High-frequency Simplified -> Traditional Buddhist terminology map for CJK normalization
SIMP_TO_TRAD_PAIRS: list[tuple[str, str]] = [
    ("金刚", "金剛"),
    ("般若", "般若"),
    ("波罗蜜", "波羅蜜"),
    ("阿弥陀", "阿彌陀"),
    ("观世音", "觀世音"),
    ("观自在", "觀自在"),
    ("药师", "藥師"),
    ("琉璃", "琉璃"),
    ("莲华", "蓮華"),
    ("法华", "法華"),
    ("楞严", "楞嚴"),
    ("大悲", "大悲"),
    ("尊胜", "尊勝"),
    ("陀罗尼", "陀羅尼"),
    ("真言", "真言"),
    ("菩萨", "菩薩"),
    ("如来", "如來"),
    ("应无所住", "應無所住"),
    ("发阿耨多罗三藐三菩提心", "發阿耨多羅三藐三菩提心"),
    ("鸠摩罗什", "鳩摩羅什"),
    ("玄奘", "玄奘"),
    ("不空", "不空"),
    ("华严", "華嚴"),
    ("涅槃", "涅槃"),
    ("维摩诘", "維摩詰"),
    ("地藏", "地藏"),
    ("普贤", "普賢"),
    ("文殊师利", "文殊師利"),
    ("随求", "隨求"),
    ("孔雀明王", "孔雀明王"),
    ("宝箧印", "寶篋印"),
    ("准提", "準提"),
    ("悉昙", "悉曇"),
    ("声明", "聲明"),
    ("经", "經"),
    ("论", "論"),
    ("译", "譯"),
    ("说", "說"),
    ("佛顶", "佛頂"),
    ("无量寿", "無量壽"),
    ("净土", "淨土"),
]


def _strip_diacritics(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in nfkd if not unicodedata.combining(ch))


def normalize_query_variants(raw: str) -> list[str]:
    clean = unicodedata.normalize("NFKC", (raw or "").strip())
    if not clean:
        return []
    trad = clean
    for s_tok, t_tok in SIMP_TO_TRAD_PAIRS:
        trad = trad.replace(s_tok, t_tok)
    ascii_folded = _strip_diacritics(clean).lower()
    variants = [clean.lower()]
    if trad.lower() != clean.lower():
        variants.append(trad.lower())
    if ascii_folded not in variants:
        variants.append(ascii_folded)
    return variants


def extract_search_keywords(query: str) -> list[str]:
    cleaned = re.sub(
        r"(请问|请解释|解释一下|帮我查|查找|检索|网站里|本库中|是什么|有哪些|怎么读|的意思|原文|出处|哪部经|如何理解)",
        " ",
        query or "",
    )
    tokens: list[str] = []
    # Canonical IDs (e.g., T08n0235, F28n1071, Toh 597, MS Add.1346)
    for m in re.finditer(r"\b(?:[TXJFABCDGKLMNPSUZW]{1,2}\d{2,3}n\d{4}[a-z]?|toh[- ]?\d+|db\d+)\b", cleaned, re.I):
        tokens.append(m.group(0).lower())
    # Latin / IAST Sanskrit terms
    for m in re.finditer(r"[A-Za-zāīūṛṝḷḹṅñṭḍṇśṣṃḥĀĪŪṚṄÑṬḌṆŚṢṂḤ]{3,}", cleaned):
        tokens.append(_strip_diacritics(m.group(0)).lower())
    # CJK segments & 2-4 char sliding n-grams for Chinese scripture queries
    for m in re.finditer(r"[\u4e00-\u9fff]{2,}", cleaned):
        seg = m.group(0)
        tokens.append(seg)
        if len(seg) > 4:
            for k in range(0, len(seg) - 1):
                if k + 3 <= len(seg):
                    tokens.append(seg[k : k + 3])
                if k + 2 <= len(seg):
                    tokens.append(seg[k : k + 2])
    expanded: list[str] = []
    seen: set[str] = set()
    for tk in tokens:
        for v in normalize_query_variants(tk):
            if len(v) >= 2 and v not in seen:
                seen.add(v)
                expanded.append(v)
    return expanded[:28]


def _download_json_gz(rel_path: str, timeout: float = 20.0) -> Any:
    local_file = CACHE_DIR / rel_path.replace("/", "__")
    if local_file.exists() and local_file.stat().st_size > 32:
        try:
            raw = local_file.read_bytes()
            if raw[:2] == b"\x1f\x8b":
                return json.loads(gzip.decompress(raw).decode("utf-8"))
            return json.loads(raw.decode("utf-8"))
        except Exception:
            pass

    urls = [f"{CORPUS_REPO_BASE}/{rel_path}"]
    if not rel_path.endswith(".gz"):
        urls.insert(0, f"{CORPUS_REPO_BASE}/{rel_path}.gz")

    for url in urls:
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "SarvaDharaniKosa-BuddhistQA/1.0"},
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                if resp.status != 200:
                    continue
                payload = resp.read()
                local_file.write_bytes(payload)
                if payload[:2] == b"\x1f\x8b":
                    return json.loads(gzip.decompress(payload).decode("utf-8"))
                return json.loads(payload.decode("utf-8"))
        except Exception:
            continue
    return None


class ServerCorpusRagIndex:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._loaded = False
        self._entries: list[dict[str, Any]] = []
        self._canon_catalog: list[dict[str, Any]] = []
        self._taisho_index: list[dict[str, Any]] = []

    def ensure_loaded(self) -> None:
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            entries: list[dict[str, Any]] = []
            for shard in ("corpus/shard-curated.json", "corpus/shard-12db.json", "corpus/shard-gretil.json"):
                data = _download_json_gz(shard)
                if isinstance(data, list):
                    entries.extend(data)
            cat = _download_json_gz("canon/catalog.json.gz")
            taisho = _download_json_gz("corpus/shard-taisho-index.json")
            self._entries = entries
            self._canon_catalog = cat if isinstance(cat, list) else []
            self._taisho_index = taisho if isinstance(taisho, list) else []
            self._loaded = True

    def stats(self) -> dict[str, Any]:
        return {
            "loaded": self._loaded,
            "dharaniAnd12DbEntries": len(self._entries),
            "cbetaCanonScriptures": len(self._canon_catalog),
            "taishoMikkyoScriptures": len(self._taisho_index),
        }

    def _fetch_canon_excerpt(self, canon_id: str, collection: str, keywords: list[str]) -> str:
        data = _download_json_gz(f"canon/cbeta/{collection}/{canon_id}.json.gz", timeout=10.0)
        if not isinstance(data, dict):
            return ""
        paragraphs = data.get("paragraphs") or []
        best_paras: list[str] = []
        for item in paragraphs:
            if not isinstance(item, list) or len(item) < 2:
                continue
            p_txt = str(item[1] or "").strip()
            if not p_txt:
                continue
            p_lower = p_txt.lower()
            hits = sum(1 for kw in keywords if kw in p_lower)
            if hits > 0:
                best_paras.append((hits, p_txt))
        best_paras.sort(key=lambda x: x[0], reverse=True)
        if best_paras:
            chosen = [p[1][:260] for p in best_paras[:3]]
            return " ｜ ".join(chosen)
        sample = [str(p[1])[:180] for p in paragraphs[:3] if isinstance(p, list) and len(p) >= 2]
        return " ｜ ".join(sample)

    def retrieve(self, query: str, top_k: int = 6) -> list[dict[str, Any]]:
        self.ensure_loaded()
        keywords = extract_search_keywords(query)
        if not keywords:
            return []

        scored: list[tuple[float, dict[str, Any]]] = []

        # 1. Score Curated + GRETIL + Global 12-Database entries
        for entry in self._entries:
            title_zh = str(entry.get("titleZh", ""))
            title_skt = str(entry.get("titleSanskritIast", ""))
            taisho_no = str(entry.get("taishoNo", ""))
            deity = str(entry.get("deityZh", ""))
            translator = str(entry.get("translatorZh", ""))
            summary = str(entry.get("meritsAndSummaryZh", ""))
            prov = entry.get("provenance") or {}
            db_badge = str(prov.get("databaseBadgeZh") or prov.get("sourceType") or "")
            verses = entry.get("verses") or []
            verse_preview = " ".join(
                f"{v.get('iast', '')} {v.get('classicalTranslitZh', '')} {v.get('meaningZh', '')}"
                for v in verses[:6]
            )

            header_blob = _strip_diacritics(
                f"{title_zh} {title_skt} {taisho_no} {deity} {translator} {db_badge}"
            ).lower()
            body_blob = _strip_diacritics(f"{summary} {verse_preview}").lower()

            score = 0.0
            for kw in keywords:
                w = math.log(1.0 + len(kw))
                if kw in header_blob:
                    score += 4.5 * w
                if kw in body_blob:
                    score += 1.8 * w
            if score <= 1.5:
                continue

            v_lines = []
            for v in verses[:4]:
                iast = str(v.get("iast", "")).strip()
                czh = str(v.get("classicalTranslitZh", "")).strip()
                mzh = str(v.get("meaningZh", "")).strip()
                v_lines.append(f"[{v.get('index', 1)}] 梵文: {iast} | 汉译: {czh} | 释义: {mzh}")

            scored.append(
                (
                    score,
                    {
                        "sourceKind": "kosa-entry",
                        "entryId": entry.get("id", ""),
                        "canonId": prov.get("cbetaId") or taisho_no,
                        "title": title_zh,
                        "badge": db_badge or taisho_no,
                        "translator": translator,
                        "url": prov.get("cbetaOnlineUrl") or prov.get("gretilRawUrl") or "",
                        "snippet": f"{summary[:220]} {' '.join(v_lines)[:380]}".strip(),
                        "score": round(score, 2),
                    },
                )
            )

        # 2. Score Full CBETA 27-Collection Canon (including pure non-dharani sutras!)
        canon_candidates: list[tuple[float, dict[str, Any]]] = []
        for c in self._canon_catalog:
            cid = str(c.get("id", ""))
            ctitle = str(c.get("title", ""))
            cbyline = str(c.get("byline", ""))
            hay = f"{cid} {ctitle} {cbyline}".lower()
            score = 0.0
            for kw in keywords:
                w = math.log(1.0 + len(kw))
                if kw == cid.lower():
                    score += 12.0
                elif kw in ctitle.lower():
                    score += 5.2 * w
                elif kw in hay:
                    score += 2.2 * w
            if c.get("collection") == "T" and score > 0:
                score += 1.2
            if score > 2.0:
                canon_candidates.append((score, c))

        canon_candidates.sort(key=lambda x: x[0], reverse=True)
        for c_score, c in canon_candidates[:3]:
            cid = str(c.get("id", ""))
            col = str(c.get("collection") or "T")
            excerpt = self._fetch_canon_excerpt(cid, col, keywords)
            has_dh = int(c.get("dharani") or 0) > 0
            scored.append(
                (
                    c_score + (2.0 if excerpt else 0.0),
                    {
                        "sourceKind": "canon-scripture",
                        "entryId": f"canon-scripture-{cid}",
                        "canonId": cid,
                        "title": f"《{c.get('title', cid)}》",
                        "badge": f"CBETA {cid} · {'含陀罗尼' if has_dh else '纯经文原典'}",
                        "translator": str(c.get("byline") or "藏经原典"),
                        "url": f"https://cbetaonline.dila.edu.tw/zh/{cid}",
                        "snippet": excerpt
                        or f"CBETA 经号 {cid}（{c.get('byline', '')}），全文共 {c.get('chars', 0)} 字。",
                        "score": round(c_score, 2),
                    },
                )
            )

        scored.sort(key=lambda x: x[0], reverse=True)
        deduped: list[dict[str, Any]] = []
        seen_titles: set[str] = set()
        for _, item in scored:
            key = f"{item.get('canonId')}|{item.get('title')}"
            if key in seen_titles:
                continue
            seen_titles.add(key)
            deduped.append(item)
            if len(deduped) >= top_k:
                break
        return deduped


GLOBAL_CORPUS_INDEX = ServerCorpusRagIndex()
