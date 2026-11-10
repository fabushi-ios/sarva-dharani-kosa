"""
Classical Sanskrit Śikṣā Pre-Normalization, Multi-Script Syllabifier,
and 48,000 Hz Neural VITS Synthesis Engine (Plan 1 & Plan 3 Core Backend).

Loads self-contained ONNX checkpoints from `/home/antigravity/models/ninada/`:
- `sa_studio_male`: `onnx/sa.onnx` (24,000 Hz Studio Male VITS, IIT Madras Rasa Sanskrit)
- `sa_studio_female`: `onnx/sa_female.onnx` (24,000 Hz Studio Female VITS)
- `sa_mobile_male`: `onnx_mobile/sa.onnx` (24,000 Hz Mobile iSTFTNet Male VITS)
- `sa_mobile_female`: `onnx_mobile/sa_female.onnx` (24,000 Hz Mobile iSTFTNet Female VITS)
- `sa_mms_16k`: `onnx/sa/encoder_flow_quantized.onnx` + `vocoder_quantized.onnx` (16,000 Hz MMS-TTS specialist)
"""
from __future__ import annotations

import base64
import hashlib
import io
import json
import math
import os
import re
import struct
import unicodedata
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
import scipy.signal
from ninada.g2p import text_to_ids as ninada_mms_text_to_ids
from ninada.studio_g2p import STUDIO_HOP_LENGTH, STUDIO_SAMPLE_RATE, STUDIO_VOCABS, studio_text_to_ids

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models" / "ninada"
TARGET_SAMPLE_RATE = 48000
PEAK_TARGET_LINEAR = 0.8912509381337456  # -1.0 dBFS

# ============================================================================
# Module 1: Multi-Script Input -> SLP1 Phonemic Encoding Engine
# ============================================================================
DEVA_TO_SLP1: dict[str, str] = {
    # 14 Independent Vowels (Svara)
    "अ": "a", "आ": "A", "इ": "i", "ई": "I", "उ": "u", "ऊ": "U",
    "ऋ": "f", "ॠ": "F", "ऌ": "x", "ॡ": "X", "ए": "e", "ऐ": "E", "ओ": "o", "औ": "O",
    # 13 Vowel Matras
    "ा": "A", "ि": "i", "ी": "I", "ु": "u", "ू": "U",
    "ृ": "f", "ॄ": "F", "ॢ": "x", "ॣ": "X", "े": "e", "ै": "E", "ो": "o", "ौ": "O",
    # Modifiers & Symbols
    "ं": "M", "ः": "H", "ँ": "~", "ऽ": "'", "ॐ": "oM", "।": "|", "॥": "||",
    "०": "0", "१": "1", "२": "2", "३": "3", "४": "4", "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
    # 34 Consonants
    "क": "k", "ख": "K", "ग": "g", "घ": "G", "ङ": "N",
    "च": "c", "छ": "C", "ज": "j", "झ": "J", "ञ": "Y",
    "ट": "w", "ठ": "W", "ड": "q", "ढ": "Q", "ण": "R",
    "त": "t", "थ": "T", "द": "d", "ध": "D", "न": "n",
    "प": "p", "फ": "P", "ब": "b", "भ": "B", "म": "m",
    "य": "y", "र": "r", "ल": "l", "व": "v",
    "श": "S", "ष": "z", "स": "s", "ह": "h", "ळ": "L",
    # Nukta variants
    "क़": "k", "ख़": "K", "ग़": "g", "ज़": "j", "ड़": "q", "ढ़": "Q", "फ़": "P",
}

DEVA_CONSONANTS: set[str] = set("कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहळ")
DEVA_MATRAS: set[str] = set("ािीुूृॄॢॣेैोौ")
DEVA_IGNORE: set[str] = {"\u0951", "\u0952", "\u0953", "\u0954", "\u200c", "\u200d"}

IAST_TO_SLP1_RULES: list[tuple[str, str]] = [
    ("ai", "E"), ("au", "O"),
    ("kh", "K"), ("gh", "G"), ("ch", "C"), ("jh", "J"),
    ("ṭh", "W"), ("ḍh", "Q"), ("th", "T"), ("dh", "D"), ("ph", "P"), ("bh", "B"),
    ("ṝ", "F"), ("ḹ", "X"), ("ā", "A"), ("ī", "I"), ("ū", "U"), ("ṛ", "f"), ("ḷ", "x"),
    ("ē", "e"), ("ō", "o"),
    ("ṅ", "N"), ("ñ", "Y"), ("ṭ", "w"), ("ḍ", "q"), ("ṇ", "R"), ("ś", "S"), ("ṣ", "z"),
    ("ṃ", "M"), ("ṁ", "M"), ("ḥ", "H"), ("ँ", "~"),
]

ROUGH_ENGLISH_WORD_MAP: dict[str, str] = {
    "om": "oṃ", "aum": "oṃ", "hum": "hūṃ", "hrim": "hrīṃ", "hreem": "hrīṃ",
    "shrim": "śrīṃ", "shreem": "śrīṃ", "srim": "śrīṃ", "klim": "klīṃ", "kleem": "klīṃ",
    "aim": "aiṃ", "krim": "krīṃ", "kreem": "krīṃ", "strim": "strīṃ",
    "svaha": "svāhā", "swaha": "svāhā", "namah": "namaḥ", "namaha": "namaḥ",
    "phat": "phaṭ", "vashat": "vaṣaṭ", "vasat": "vaṣaṭ", "vaushat": "vauṣaṭ",
    "shanti": "śāntiḥ", "shantih": "śāntiḥ", "santi": "śāntiḥ",
    "mani": "maṇi", "padme": "padme", "tare": "tāre", "tuttare": "tuttāre", "ture": "ture",
    "shiva": "śiva", "shivaya": "śivāya", "krishna": "kṛṣṇa", "rama": "rāma",
    "gayatri": "gāyatrī", "mantra": "mantra", "dharma": "dharma", "karma": "karma",
    "buddha": "buddha", "bodhi": "bodhi", "sattva": "sattva", "bhagavate": "bhagavate",
    "vasudevaya": "vāsudevāya", "narayanaya": "nārāyaṇāya", "ganeshaya": "gaṇeśāya",
    "trayaya": "trayāya",
    "shri": "śrī", "sri": "śrī", "hridaya": "hṛdaya", "amrita": "amṛta",
    "prajna": "prajñā", "paramita": "pāramitā", "avalokiteshvara": "avalokiteśvara",
    "gate": "gate", "paragate": "pāragate", "parasamgate": "pārasaṃgate",
}

SLP1_TO_IAST: dict[str, str] = {
    "a": "a", "A": "ā", "i": "i", "I": "ī", "u": "u", "U": "ū",
    "f": "ṛ", "F": "ṝ", "x": "ḷ", "X": "ḹ", "e": "e", "E": "ai", "o": "o", "O": "au",
    "M": "ṃ", "H": "ḥ", "~": "ँ", "'": "'",
    "k": "k", "K": "kh", "g": "g", "G": "gh", "N": "ṅ",
    "c": "c", "C": "ch", "j": "j", "J": "jh", "Y": "ñ",
    "w": "ṭ", "W": "ṭh", "q": "ḍ", "Q": "ḍh", "R": "ṇ",
    "t": "t", "T": "th", "d": "d", "D": "dh", "n": "n",
    "p": "p", "P": "ph", "b": "b", "B": "bh", "m": "m",
    "y": "y", "r": "r", "l": "l", "v": "v",
    "S": "ś", "z": "ṣ", "s": "s", "h": "h", "L": "ḷ",
}

SLP1_VOWEL_TO_DEVA: dict[str, str] = {
    "a": "अ", "A": "आ", "i": "इ", "I": "ई", "u": "उ", "U": "ऊ",
    "f": "ऋ", "F": "ॠ", "x": "ऌ", "X": "ॡ", "e": "ए", "E": "ऐ", "o": "ओ", "O": "औ",
}

SLP1_MATRA_TO_DEVA: dict[str, str] = {
    "a": "", "A": "ा", "i": "ि", "I": "ी", "u": "ु", "U": "ू",
    "f": "ृ", "F": "ॄ", "x": "ॢ", "X": "ॣ", "e": "े", "E": "ै", "o": "ो", "O": "ौ",
}

SLP1_CONS_TO_DEVA: dict[str, str] = {
    "k": "क", "K": "ख", "g": "ग", "G": "घ", "N": "ङ",
    "c": "च", "C": "छ", "j": "ज", "J": "झ", "Y": "ञ",
    "w": "ट", "W": "ठ", "q": "ड", "Q": "ढ", "R": "ण",
    "t": "त", "T": "थ", "d": "द", "D": "ध", "n": "न",
    "p": "प", "P": "फ", "b": "ब", "B": "भ", "m": "म",
    "y": "य", "r": "र", "l": "ल", "v": "व",
    "S": "श", "z": "ष", "s": "स", "h": "ह", "L": "ळ",
}

# ============================================================================
# Module 2: 34×14 Siddhaṃ Matrix, Overrides & Canonical Corpus
# ============================================================================
VOWEL_MAP: dict[str, list[str]] = {
    "a": ["阿", "阿"], "A": ["阿", "阿"],
    "i": ["伊", "伊"], "I": ["衣", "伊"],
    "u": ["乌", "坞"], "U": ["屋", "乌"],
    "f": ["里", "哩"], "F": ["里", "哩"],
    "x": ["吕", "力"], "X": ["吕", "力"],
    "e": ["诶", "翳"], "E": ["爱", "蔼"],
    "o": ["欧", "污"], "O": ["奥", "奥"],
}

MATRIX_CONSONANTS: list[str] = [
    "k", "K", "g", "G", "N",
    "c", "C", "j", "J", "Y",
    "w", "W", "q", "Q", "R",
    "t", "T", "d", "D", "n",
    "p", "P", "b", "B", "m",
    "y", "r", "l", "v",
    "S", "z", "s", "h", "L",
]

MATRIX_VOWELS: list[str] = ["a", "A", "i", "I", "u", "U", "f", "F", "x", "X", "e", "E", "o", "O"]
STANDALONE_SVARAS: list[str] = ["a", "A", "i", "I", "u", "U", "f", "F", "x", "X", "e", "E", "o", "O", "aM", "aH"]

CONS_MATRIX: dict[str, dict[str, Any]] = {
    "k": {"varga": "喉音 (Velar)", "bare": ["克", "克"], "m": ["嘎", "给", "咕", "格里", "给", "该", "郭", "高"], "t": ["迦", "吉", "俱", "讫哩", "计", "皆", "拘", "憍"], "note": "喉清不送气 (听感如 g)"},
    "K": {"varga": "喉音 (Velar)", "bare": ["可", "佉"], "m": ["卡", "奇", "枯", "克里", "开", "凯", "考", "尻"], "t": ["佉", "弃", "区", "企哩", "契", "楷", "寇", "考"], "note": "喉清送气 (kh)"},
    "g": {"varga": "喉音 (Velar)", "bare": ["格", "伽"], "m": ["噶", "吉", "古", "格里", "给", "改", "果", "搞"], "t": ["伽", "祇", "具", "吃哩", "艺", "盖", "瞿", "豪"], "note": "喉浊不送气 (g)"},
    "G": {"varga": "喉音 (Velar)", "bare": ["格哈", "伽"], "m": ["噶哈", "吉哈", "古哈", "格里哈", "给哈", "改哈", "果哈", "搞哈"], "t": ["伽", "祇", "具", "伽哩", "诣", "慨", "瞿", "豪"], "note": "喉浊送气 (gh)"},
    "N": {"varga": "喉音 (Velar)", "bare": ["昂", "仰"], "m": ["昂阿", "昂伊", "昂乌", "昂里", "昂诶", "昂爱", "昂欧", "昂奥"], "t": ["仰", "儗", "隅", "仰哩", "倪", "捱", "悟", "敖"], "note": "喉鼻音 (ṅ / ng)"},
    "c": {"varga": "颚音 (Palatal)", "bare": ["兹", "遮"], "m": ["扎", "几", "租", "兹里", "哲", "斋", "卓", "招"], "t": ["遮", "支", "主", "室哩", "制", "斋", "祖", "昭"], "note": "颚清不送气 (听感如 j/zh)"},
    "C": {"varga": "颚音 (Palatal)", "bare": ["呲", "车"], "m": ["擦", "七", "粗", "次里", "车", "拆", "绰", "超"], "t": ["车", "齿", "刍", "痴哩", "掣", "差", "初", "抄"], "note": "颚清送气 (ch/q)"},
    "j": {"varga": "颚音 (Palatal)", "bare": ["吉", "阇"], "m": ["佳", "吉", "居", "吉里", "杰", "宅", "卓", "焦"], "t": ["阇", "尔", "殊", "日哩", "逝", "惹", "助", "招"], "note": "颚浊不送气 (j)"},
    "J": {"varga": "颚音 (Palatal)", "bare": ["吉哈", "社"], "m": ["佳哈", "吉哈", "居哈", "吉里哈", "杰哈", "宅哈", "卓哈", "焦哈"], "t": ["社", "时", "殊", "社哩", "誓", "寨", "祚", "召"], "note": "颚浊送气 (jh)"},
    "Y": {"varga": "颚音 (Palatal)", "bare": ["尼", "若"], "m": ["尼亚", "尼", "纽", "尼里", "涅", "尼爱", "尼欧", "尼奥"], "t": ["若", "你", "柔", "若哩", "泥", "乃", "尿", "饶"], "note": "颚鼻音 (ñ / ny)"},
    "w": {"varga": "卷舌音 (Retroflex)", "bare": ["特", "吒"], "m": ["哒", "滴", "嘟", "德里", "得", "呆", "多", "刀"], "t": ["吒", "知", "都", "致哩", "致", "斋", "都", "嘲"], "note": "卷舌清不送气 (ṭ)"},
    "W": {"varga": "卷舌音 (Retroflex)", "bare": ["踏", "咤"], "m": ["踏", "踢", "突", "特里", "忒", "胎", "托", "掏"], "t": ["咤", "耻", "偷", "耻哩", "体", "泰", "侘", "滔"], "note": "卷舌清送气 (ṭh)"},
    "q": {"varga": "卷舌音 (Retroflex)", "bare": ["德", "荼"], "m": ["达", "迪", "读", "德里", "得", "代", "夺", "导"], "t": ["荼", "腻", "度", "荼哩", "提", "代", "度", "陶"], "note": "卷舌浊不送气 (ḍ)"},
    "Q": {"varga": "卷舌音 (Retroflex)", "bare": ["德哈", "荼"], "m": ["达哈", "迪哈", "读哈", "德里哈", "得哈", "代哈", "夺哈", "导哈"], "t": ["荼", "腻", "度", "荼哩", "提", "代", "度", "陶"], "note": "卷舌浊送气 (ḍh)"},
    "R": {"varga": "卷舌音 (Retroflex)", "bare": ["呐", "拏"], "m": ["呐", "尼", "奴", "呐里", "内", "乃", "诺", "挠"], "t": ["拏", "尼", "怒", "拏哩", "泥", "乃", "诺", "闹"], "note": "卷舌鼻音 (ṇ)"},
    "t": {"varga": "齿音 (Dental)", "bare": ["特", "多"], "m": ["搭", "滴", "督", "特里", "得", "呆", "多", "刀"], "t": ["多", "底", "都", "底哩", "帝", "带", "都", "刀"], "note": "齿清不送气 (听感如 d)"},
    "T": {"varga": "齿音 (Dental)", "bare": ["塔", "他"], "m": ["塔", "替", "图", "特里", "太", "泰", "托", "涛"], "t": ["他", "体", "土", "他哩", "替", "太", "吐", "讨"], "note": "齿清送气 (th)"},
    "d": {"varga": "齿音 (Dental)", "bare": ["德", "陀"], "m": ["达", "迪", "读", "德里", "代", "歹", "朵", "道"], "t": ["陀", "地", "度", "陀哩", "提", "代", "度", "道"], "note": "齿浊不送气 (d)"},
    "D": {"varga": "齿音 (Dental)", "bare": ["德哈", "驮"], "m": ["达哈", "迪哈", "读哈", "德里哈", "代哈", "歹哈", "朵哈", "道哈"], "t": ["驮", "第", "度", "驮哩", "提", "代", "度", "道"], "note": "齿浊送气 (dh)"},
    "n": {"varga": "齿音 (Dental)", "bare": ["恩", "那"], "m": ["那", "尼", "努", "那哩", "内", "奈", "诺", "恼"], "t": ["那", "尼", "奴", "那哩", "祢", "乃", "怒", "恼"], "note": "齿鼻音 (n)"},
    "p": {"varga": "唇音 (Labial)", "bare": ["普", "波"], "m": ["巴", "比", "布", "普里", "贝", "拜", "波", "包"], "t": ["波", "比", "补", "钵哩", "闭", "拜", "逋", "宝"], "note": "唇清不送气 (听感如 b)"},
    "P": {"varga": "唇音 (Labial)", "bare": ["扑", "颇"], "m": ["帕", "批", "铺", "普里", "胚", "派", "坡", "抛"], "t": ["颇", "匹", "普", "颇哩", "沛", "派", "破", "泡"], "note": "唇清送气 (ph)"},
    "b": {"varga": "唇音 (Labial)", "bare": ["布", "婆"], "m": ["拔", "鼻", "不", "布里", "北", "白", "博", "薄"], "t": ["婆", "毗", "部", "跋哩", "陛", "败", "菩", "暴"], "note": "唇浊不送气 (b)"},
    "B": {"varga": "唇音 (Labial)", "bare": ["布哈", "婆"], "m": ["巴(重)", "比(重)", "布(重)", "布里(重)", "贝(重)", "拜(重)", "博(重)", "包(重)"], "t": ["婆", "毗", "部", "婆哩", "吠", "拜", "菩", "鲍"], "note": "唇浊送气 (bh)"},
    "m": {"varga": "唇音 (Labial)", "bare": ["姆", "摩"], "m": ["嘛", "咪", "木", "姆里", "美", "麦", "摩", "毛"], "t": ["摩", "弥", "母", "蜜哩", "迷", "迈", "谟", "矛"], "note": "唇鼻音 (m)"},
    "y": {"varga": "半元音 (Semivowel)", "bare": ["伊", "耶"], "m": ["呀", "伊", "优", "伊里", "耶", "崖", "哟", "妖"], "t": ["耶", "以", "由", "拽哩", "曳", "耶", "瑜", "要"], "note": "颚半元音 (y)"},
    "r": {"varga": "半元音 (Semivowel)", "bare": ["尔", "啰"], "m": ["啦", "里", "鲁", "里", "雷", "来", "罗", "劳"], "t": ["啰", "利", "噜", "哩", "礼", "来", "路", "牢"], "note": "舌尖颤音 (r)"},
    "l": {"varga": "半元音 (Semivowel)", "bare": ["勒", "罗"], "m": ["拉", "利", "卢", "勒里", "雷", "赖", "洛", "捞"], "t": ["罗", "离", "路", "嚧", "隶", "赖", "路", "劳"], "note": "齿边音 (l)"},
    "v": {"varga": "半元音 (Semivowel)", "bare": ["夫", "嚩"], "m": ["瓦", "维", "乌", "弗里", "威", "歪", "窝", "凹"], "t": ["嚩", "尾", "无", "嚩哩", "吠", "吠", "务", "嚩奥"], "note": "唇齿半元音 (v/w)"},
    "S": {"varga": "擦音 (Sibilant)", "bare": ["什", "奢"], "m": ["夏", "希", "舒", "什里", "谁", "晒", "说", "烧"], "t": ["奢", "尸", "输", "室哩", "世", "晒", "戍", "烧"], "note": "颚擦音 (ś / sh)"},
    "z": {"varga": "擦音 (Sibilant)", "bare": ["嘶", "沙"], "m": ["沙", "师", "书", "什里", "奢", "筛", "朔", "稍"], "t": ["沙", "史", "刍", "瑟哩", "势", "晒", "疏", "梢"], "note": "卷舌擦音 (ṣ)"},
    "s": {"varga": "擦音 (Sibilant)", "bare": ["斯", "娑"], "m": ["萨", "西", "苏", "斯里", "塞", "腮", "索", "骚"], "t": ["娑", "悉", "苏", "悉哩", "细", "赛", "素", "骚"], "note": "齿擦音 (s)"},
    "h": {"varga": "气音 (Aspirate)", "bare": ["赫", "诃"], "m": ["哈", "希", "呼", "赫里", "黑", "嗨", "豁", "好"], "t": ["诃", "醯", "虎", "紇哩", "醯", "海", "呼", "豪"], "note": "声门浊擦音 (h)"},
    "L": {"varga": "吠陀音 (Vedic)", "bare": ["勒", "罗"], "m": ["啦", "里", "卢", "里", "雷", "赖", "洛", "捞"], "t": ["罗", "离", "路", "哩", "隶", "赖", "路", "劳"], "note": "吠陀卷舌边音 (ḷ)"},
}

VOWEL_INDEX: dict[str, int] = {
    "a": 0, "A": 0, "i": 1, "I": 1, "u": 2, "U": 2,
    "f": 3, "F": 3, "x": 3, "X": 3, "e": 4, "E": 5, "o": 6, "O": 7,
}
LONG_VOWELS: set[str] = {"A", "I", "U", "F", "X", "e", "E", "o", "O"}
SHORT_VOWELS: set[str] = {"a", "i", "u", "f", "x"}
INHERENT_LONG_VOWELS: set[str] = {"A", "I", "U", "F", "X"}

SYLLABLE_OVERRIDES: dict[str, dict[str, str]] = {
    "oM":   {"m": "嗡",     "t": "唵",     "note": "神圣种子字 (oṃ)"},
    "hUM":  {"m": "轰",     "t": "吽",     "note": "圆满种子字 (hūṃ)"},
    "huM":  {"m": "轰",     "t": "吽",     "note": "种子字 (huṃ)"},
    "hrIH": {"m": "赫里希", "t": "纥哩",   "note": "莲花部种子字 (hrīḥ)"},
    "hrIM": {"m": "赫里姆", "t": "纥哩",   "note": "种子字 (hrīṃ)"},
    "SrIM": {"m": "什里姆", "t": "室哩",   "note": "吉祥种子字 (śrīṃ)"},
    "klIM": {"m": "克里姆", "t": "讫哩",   "note": "钩召种子字 (klīṃ)"},
    "DIH":  {"m": "迪希",   "t": "谛",     "note": "文殊智慧种子字 (dhīḥ)"},
    "BrUM": {"m": "布鲁姆", "t": "勃",     "note": "佛顶尊胜种子字 (bhrūṃ)"},
    "svA":  {"m": "斯哇",   "t": "娑婆",   "note": "吉祥圆满词根 (svā)"},
    "sva":  {"m": "斯瓦",   "t": "娑嚩",   "note": "自性/天界 (sva)"},
    "svaH": {"m": "斯瓦哈", "t": "娑嚩诃", "note": "天界 (svaḥ)"},
    "svar": {"m": "斯瓦尔", "t": "娑嚩啰", "note": "天界 (svar)"},
    "BUr":  {"m": "布尔",   "t": "婆啰",   "note": "地界 (bhūr)"},
    "BUH":  {"m": "布呼",   "t": "婆诃",   "note": "地界 (bhūḥ)"},
    "hA":   {"m": "哈",     "t": "诃",     "note": "成就尾音 (hā)"},
    "SrI":  {"m": "什里",   "t": "室利",   "note": "吉祥尊称 (śrī)"},
    "pra":  {"m": "普拉",   "t": "般若",   "note": "胜义前缀 (pra)"},
    "jYA":  {"m": "佳尼亚", "t": "若",     "note": "般若智慧词根 (jñā)"},
    "jYa":  {"m": "佳尼亚", "t": "若",     "note": "智 (jña)"},
    "kza":  {"m": "克沙",   "t": "叉",     "note": "二合复辅音 (kṣa)"},
    "kzA":  {"m": "克沙",   "t": "叉",     "note": "二合复辅音 (kṣā)"},
    "kzi":  {"m": "克希",   "t": "絺",     "note": "二合复辅音 (kṣi)"},
    "kzI":  {"m": "克希",   "t": "絺",     "note": "二合复辅音 (kṣī)"},
    "kzu":  {"m": "克书",   "t": "刍",     "note": "二合复辅音 (kṣu)"},
    "kze":  {"m": "克奢",   "t": "制",     "note": "二合复辅音 (kṣe)"},
    "Paw":  {"m": "帕特",   "t": "发吒",   "note": "破障催伏音 (phaṭ)"},
    "saM":  {"m": "萨姆",   "t": "僧",     "note": "正等/和合前缀 (saṃ)"},
}

TRAD_WORD_REPLACEMENTS: dict[str, str] = {
    "gate": "揭谛",
    "pAragate": "波罗揭谛",
    "pArasaMgate": "波罗僧揭谛",
    "boDi": "菩提",
    "svAhA": "萨婆诃",
    "namo": "南无",
    "namaH": "南无",
    "Bagavate": "婆伽伐帝",
    "BagavAn": "婆伽梵",
    "avalokiteSvara": "阿缚卢枳低湿伐逻",
    "prajYApAramitA": "般若波罗蜜多",
    "tadyaTA": "怛侄他",
    "padme": "钵头摩",
    "maRi": "摩尼",
    "tAre": "多",
    "tuttAre": "都多",
    "ture": "都",
    "Bezajye": "鞞杀逝",
    "mahABezajye": "摩诃鞞杀逝",
    "samudgate": "三没揭帝",
}

SAMPLES: list[str] = [
    "gate gate pāragate pārasaṃgate bodhi svāhā",
    "oṃ maṇi padme hūṃ | namo bhagavate vāsudevāya",
    "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्",
    "kārtsnyena śrī-bhagavān uvāca",
    "oṃ tāre tuttāre ture svāhā",
    "oṃ a ra pa ca na dhīḥ",
    "namo bhagavate bhaiṣajyaguru vaidūryaprabharājāya tathāgatāya arhate samyaksaṃbuddhāya tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye rājasamudgate svāhā",
    "om mani padme hum | om shanti shanti shantih",
]

VOWEL_SET: set[str] = set("aAiIuUfFxXeEoO")
CONS_SET: set[str] = set(CONS_MATRIX.keys())
MOD_SET: set[str] = {"M", "H", "~"}

VALID_ONSET_PAIRS: set[str] = {
    "pr", "br", "tr", "dr", "kr", "gr", "Sr", "zr", "sr", "Pl", "kl", "gl", "Sl",
    "sv", "tv", "dv", "kv", "gv", "zv", "Sv",
    "ky", "gy", "py", "by", "vy", "ty", "Dy", "Sy", "zy", "sy", "hy", "jy", "cy",
    "kz", "jY", "zw", "zW", "st", "sT", "sp", "sP", "sk", "sK", "sm", "sn",
}


def devanagari_chunk_to_slp1(text: str) -> str:
    norm = unicodedata.normalize("NFC", text)
    out: list[str] = []
    i = 0
    n = len(norm)
    while i < n:
        ch = norm[i]
        if ch in DEVA_IGNORE:
            i += 1
            continue
        nxt = norm[i + 1] if i + 1 < n else ""
        if ch in DEVA_CONSONANTS:
            out.append(DEVA_TO_SLP1[ch])
            if nxt == "्":
                i += 2
                continue
            elif nxt in DEVA_MATRAS:
                out.append(DEVA_TO_SLP1[nxt])
                i += 2
                continue
            elif nxt == "़":
                i += 1
                after_nukta = norm[i + 1] if i + 1 < n else ""
                if after_nukta == "्":
                    i += 2
                    continue
                elif after_nukta in DEVA_MATRAS:
                    out.append(DEVA_TO_SLP1[after_nukta])
                    i += 2
                    continue
                else:
                    out.append("a")
                    i += 1
                    continue
            else:
                out.append("a")
                i += 1
                continue
        elif ch in DEVA_TO_SLP1:
            out.append(DEVA_TO_SLP1[ch])
            i += 1
        else:
            out.append(ch)
            i += 1
    return "".join(out)


def latin_chunk_to_slp1(chunk: str, mode: str = "smart") -> str:
    if mode == "slp1":
        return chunk
    s = unicodedata.normalize("NFC", chunk).lower()
    if mode == "smart":
        def _repl_word(m: re.Match[str]) -> str:
            word = m.group(0)
            if word in ROUGH_ENGLISH_WORD_MAP:
                return ROUGH_ENGLISH_WORD_MAP[word]
            if not re.search(r"[āīūṛṝḷḹṅñṭḍṇśṣṃṁḥ]", word):
                w = (
                    word.replace("shh", "ṣ")
                    .replace("ksh", "kṣ")
                    .replace("sh", "ś")
                    .replace("aa", "ā")
                    .replace("ee", "ī")
                    .replace("oo", "ū")
                )
                return w
            return word

        s = re.sub(r"[a-zāīūṛṝḷḹṅñṭḍṇśṣṃṁḥ']+", _repl_word, s)
    for iast, slp in IAST_TO_SLP1_RULES:
        s = s.replace(iast, slp)
    return s


def input_to_slp1(text: str, mode: str = "smart") -> str:
    if mode == "auto":
        mode = "smart"
    elif mode == "iast":
        mode = "strict"
    parts = re.findall(r"[\u0900-\u097F\u200c\u200d]+|[^\u0900-\u097F\u200c\u200d]+", text or "")
    out: list[str] = []
    for part in parts:
        if re.search(r"[\u0900-\u097F]", part):
            out.append(devanagari_chunk_to_slp1(part))
        else:
            out.append(latin_chunk_to_slp1(part, mode))
    return "".join(out)


def slp1_to_iast(slp: str) -> str:
    return "".join(SLP1_TO_IAST.get(c, c) for c in slp)


def slp1_to_devanagari(slp: str) -> str:
    out: list[str] = []
    i = 0
    n = len(slp)
    while i < n:
        if (
            slp[i : i + 2] == "oM"
            and (i == 0 or slp[i - 1] not in SLP1_CONS_TO_DEVA)
            and (i + 2 >= n or slp[i + 2] not in SLP1_VOWEL_TO_DEVA)
        ):
            out.append("ॐ")
            i += 2
            continue
        ch = slp[i]
        nxt = slp[i + 1] if i + 1 < n else ""
        if ch in SLP1_CONS_TO_DEVA:
            out.append(SLP1_CONS_TO_DEVA[ch])
            if nxt in SLP1_MATRA_TO_DEVA:
                out.append(SLP1_MATRA_TO_DEVA[nxt])
                i += 2
            else:
                out.append("्")
                i += 1
        elif ch in SLP1_VOWEL_TO_DEVA:
            out.append(SLP1_VOWEL_TO_DEVA[ch])
            i += 1
        elif ch == "M":
            out.append("ं")
            i += 1
        elif ch == "H":
            out.append("ः")
            i += 1
        elif ch == "~":
            out.append("ँ")
            i += 1
        elif ch == "'":
            out.append("ऽ")
            i += 1
        elif ch == "|" and nxt == "|":
            out.append("॥")
            i += 2
        elif ch == "|":
            out.append("।")
            i += 1
        else:
            out.append(ch)
            i += 1
    return "".join(out)


# ============================================================================
# Module 3: Prosodic Syllabifier & Context-Aware Mapper
# ============================================================================
def syllabify_slp1_word(slp_word: str) -> list[dict[str, Any]]:
    raw_tokens: list[dict[str, Any]] = []
    i = 0
    n = len(slp_word)
    while i < n:
        if (
            slp_word[i : i + 2] == "oM"
            and (i == 0 or slp_word[i - 1] not in CONS_SET)
            and (i + 2 == n or slp_word[i + 2] not in VOWEL_SET)
        ):
            raw_tokens.append({"onset": "", "vowel": "o", "mod": "M", "coda": "", "isOm": True})
            i += 2
            continue

        cons_cluster = ""
        while i < n and slp_word[i] in CONS_SET:
            cons_cluster += slp_word[i]
            i += 1

        vowel = ""
        if i < n and slp_word[i] in VOWEL_SET:
            vowel = slp_word[i]
            i += 1

        mod = ""
        while i < n and slp_word[i] in MOD_SET:
            mod += slp_word[i]
            i += 1

        if not cons_cluster and not vowel and not mod:
            raw_tokens.append({"symbol": slp_word[i]})
            i += 1
            continue

        raw_tokens.append({"onset": cons_cluster, "vowel": vowel, "mod": mod, "coda": ""})

    # Pass 2: Merge word-final vowelless consonant clusters into preceding syllable coda
    merged: list[dict[str, Any]] = []
    for cur in raw_tokens:
        if "symbol" in cur:
            merged.append(cur)
            continue
        if cur["onset"] and not cur["vowel"] and not cur["mod"] and len(merged) > 0:
            prev = merged[-1]
            if prev and "symbol" not in prev and prev.get("vowel") and not prev.get("mod") and not prev.get("isOm"):
                prev["coda"] += cur["onset"]
                continue
        merged.append(cur)

    # Pass 3: Medial consonant cluster splitting (Coda + Onset)
    for idx in range(1, len(merged)):
        prev = merged[idx - 1]
        cur = merged[idx]
        if not prev or not cur or "symbol" in prev or "symbol" in cur or not prev.get("vowel") or not cur.get("vowel"):
            continue
        if prev.get("mod") or prev.get("coda"):
            continue

        cluster = cur["onset"]
        if len(cluster) >= 2:
            candidate_whole = cluster + cur["vowel"] + cur["mod"]
            if candidate_whole in SYLLABLE_OVERRIDES:
                continue

            if len(cluster) == 2:
                c1, c2 = cluster[0], cluster[1]
                should_split = (c1 == "r") or (c1 == c2) or (cluster not in VALID_ONSET_PAIRS)
                if should_split:
                    prev["coda"] = c1
                    cur["onset"] = c2
            elif len(cluster) >= 3:
                if cluster[0] == "r" and cluster[1] in "tkpws" and len(cluster) >= 4:
                    prev["coda"] = cluster[:2]
                    cur["onset"] = cluster[2:]
                else:
                    prev["coda"] = cluster[0]
                    cur["onset"] = cluster[1:]

    return merged


def resolve_modifiers(
    mod: str, vowel: str, next_onset_char: str = "", enable_assimilation: bool = True
) -> dict[str, str]:
    if not mod:
        return {"mMod": "", "tMod": "", "modNote": ""}
    m_mod = ""
    t_mod = ""
    notes: list[str] = []

    if "M" in mod or "~" in mod:
        if enable_assimilation and next_onset_char:
            if next_onset_char in "kKgGN":
                m_mod += "昂"
                t_mod += "僧"
                notes.append("随韵ṃ遇喉音同化为[ŋ]")
            elif next_onset_char in "cCjJYSy":
                m_mod += "恩"
                t_mod += "ဉ"
                notes.append("随韵ṃ遇颚音同化为[ɲ]")
            elif next_onset_char in "wWqQRtTdDnsz":
                m_mod += "恩"
                t_mod += "僧"
                notes.append("随韵ṃ遇齿/卷舌音同化为[n]")
            else:
                m_mod += "姆"
                t_mod += "牟"
                notes.append("随韵ṃ闭唇鼻音[m]")
        else:
            m_mod += "姆"
            t_mod += "南"
            notes.append("随韵鼻音(Anusvāra)")

    if "H" in mod:
        if enable_assimilation:
            if vowel in ("i", "I"):
                m_mod += "希"
                t_mod += "醯"
            elif vowel in ("u", "U"):
                m_mod += "呼"
                t_mod += "虎"
            elif vowel in ("e", "E"):
                m_mod += "嘿"
                t_mod += "醯"
            elif vowel in ("o", "O"):
                m_mod += "豁"
                t_mod += "呼"
            elif vowel in ("f", "F"):
                m_mod += "里希"
                t_mod += "哩醯"
            else:
                m_mod += "哈"
                t_mod += "诃"
            notes.append("止韵ḥ元音回响")
        else:
            m_mod += "哈"
            t_mod += "诃"
            notes.append("止韵送气(Visarga)")

    return {"mMod": m_mod, "tMod": t_mod, "modNote": "·".join(notes)}


def parse_and_transliterate_word(
    slp_word: str, assimilate: bool = True, long_mark_symbol: str = "～"
) -> list[dict[str, Any]]:
    tokens = syllabify_slp1_word(slp_word)
    syllables: list[dict[str, Any]] = []

    for idx, tk in enumerate(tokens):
        next_tk = tokens[idx + 1] if idx + 1 < len(tokens) else None
        next_onset_char = next_tk["onset"][0] if (next_tk and next_tk.get("onset")) else ""

        if "symbol" in tk:
            sym = tk["symbol"]
            if sym == "'":
                syllables.append({
                    "raw": "'", "m": "·", "t": "", "meter": "", "varga": "连音符",
                    "note": "省音符 Avagraha (前接长元音延音)", "isSymbol": True,
                })
            elif sym in ("|", "."):
                syllables.append({
                    "raw": sym, "m": "｜", "t": "।", "meter": "", "varga": "标点",
                    "note": "梵文句读竖线 (Daṇḍa)", "isSymbol": True,
                })
            else:
                syllables.append({
                    "raw": sym, "m": sym, "t": sym, "meter": "", "varga": "符号",
                    "note": "分隔符", "isSymbol": True,
                })
            continue

        raw_syl = tk["onset"] + tk["vowel"] + tk["mod"] + tk["coda"]
        next_cluster_len = len(next_tk["onset"]) if (next_tk and next_tk.get("onset")) else 0
        is_guru = (
            (tk["vowel"] in LONG_VOWELS)
            or bool(tk["mod"])
            or bool(tk["coda"])
            or (next_cluster_len >= 2)
        )
        meter = ("—" if is_guru else "⏑") if tk["vowel"] else ""

        if tk.get("isOm") or raw_syl in SYLLABLE_OVERRIDES:
            ov = SYLLABLE_OVERRIDES["oM"] if tk.get("isOm") else SYLLABLE_OVERRIDES[raw_syl]
            m_text = ov["m"]
            t_text = ov["t"]
            if long_mark_symbol and (tk["vowel"] in INHERENT_LONG_VOWELS) and not tk["mod"] and not tk["coda"]:
                m_text += long_mark_symbol
            if raw_syl == "saM" and assimilate and next_onset_char:
                m_mod_info = resolve_modifiers("M", "a", next_onset_char, True)
                m_text = "萨" + m_mod_info["mMod"]
            syllables.append({
                "raw": raw_syl,
                "m": m_text,
                "t": t_text,
                "meter": meter,
                "varga": "特殊陀罗尼音节",
                "note": ov["note"] + (" · 重音节(Guru)" if is_guru else " · 轻音节(Laghu)"),
                "isSymbol": False,
            })
            continue

        base_without_coda = tk["onset"] + tk["vowel"] + tk["mod"]
        if tk["coda"] and base_without_coda in SYLLABLE_OVERRIDES:
            ov = SYLLABLE_OVERRIDES[base_without_coda]
            coda_m = "".join(CONS_MATRIX[c]["bare"][0] for c in tk["coda"])
            coda_t = "".join(CONS_MATRIX[c]["bare"][1] for c in tk["coda"])
            l_mark = long_mark_symbol if (long_mark_symbol and tk["vowel"] in INHERENT_LONG_VOWELS and not tk["mod"]) else ""
            syllables.append({
                "raw": raw_syl,
                "m": ov["m"] + l_mark + coda_m,
                "t": ov["t"] + coda_t,
                "meter": meter,
                "varga": "复合闭音节",
                "note": f"{ov['note']} + 尾收音[-{slp1_to_iast(tk['coda'])}]",
                "isSymbol": False,
            })
            continue

        if tk["onset"] and not tk["vowel"]:
            m_parts = [CONS_MATRIX[c]["bare"][0] for c in tk["onset"]]
            t_parts = [CONS_MATRIX[c]["bare"][1] for c in tk["onset"]]
            syllables.append({
                "raw": raw_syl,
                "m": f"({''.join(m_parts)})",
                "t": "".join(t_parts),
                "meter": "",
                "varga": CONS_MATRIX[tk["onset"][0]]["varga"],
                "note": "无元音收音辅音 (Virāma)",
                "isSymbol": False,
            })
            continue

        if not tk["onset"] and tk["vowel"]:
            m_base, t_base = VOWEL_MAP.get(tk["vowel"], [tk["vowel"], tk["vowel"]])
            if long_mark_symbol and tk["vowel"] in INHERENT_LONG_VOWELS:
                m_base += long_mark_symbol
            mod_res = resolve_modifiers(tk["mod"], tk["vowel"], next_onset_char, assimilate)
            coda_m = "".join(CONS_MATRIX[c]["bare"][0] for c in tk["coda"])
            coda_t = "".join(CONS_MATRIX[c]["bare"][1] for c in tk["coda"])
            syllables.append({
                "raw": raw_syl,
                "m": m_base + mod_res["mMod"] + coda_m,
                "t": t_base + mod_res["tMod"] + coda_t,
                "meter": meter,
                "varga": "独立元音 (Svara)",
                "note": ("独立长元音" if tk["vowel"] in LONG_VOWELS else "独立短元音")
                + (f" · {mod_res['modNote']}" if mod_res["modNote"] else "")
                + (f" · 收音[-{slp1_to_iast(tk['coda'])}]" if tk["coda"] else ""),
                "isSymbol": False,
            })
            continue

        prefix_m = ""
        prefix_t = ""
        prefix_cons = tk["onset"][:-1]
        main_cons = tk["onset"][-1]
        is_special_conjunct = False
        special_note = ""

        if tk["onset"].endswith("kz"):
            prefix_cons = tk["onset"][:-2]
            for c in prefix_cons:
                prefix_m += CONS_MATRIX[c]["bare"][0]
                prefix_t += CONS_MATRIX[c]["bare"][1]
            prefix_m += "克"
            main_cons = "z"
            is_special_conjunct = True
            special_note = "二合辅音[kṣ]"
        elif tk["onset"].endswith("jY"):
            prefix_cons = tk["onset"][:-2]
            for c in prefix_cons:
                prefix_m += CONS_MATRIX[c]["bare"][0]
                prefix_t += CONS_MATRIX[c]["bare"][1]
            prefix_m += "佳"
            main_cons = "Y"
            is_special_conjunct = True
            special_note = "二合辅音[jñ]"
        else:
            for c in prefix_cons:
                prefix_m += CONS_MATRIX[c]["bare"][0]
                prefix_t += CONS_MATRIX[c]["bare"][1]

        v_idx = VOWEL_INDEX.get(tk["vowel"], 0)
        c_entry = CONS_MATRIX[main_cons]
        main_m = c_entry["m"][v_idx]
        if is_special_conjunct and tk["onset"].endswith("kz"):
            main_t = ["叉", "絺", "刍", "刹哩", "制", "差", "初", "抄"][v_idx]
        elif is_special_conjunct and tk["onset"].endswith("jY"):
            main_t = ["若", "若", "如", "若哩", "若", "若", "若", "若"][v_idx]
        else:
            main_t = c_entry["t"][v_idx]

        if long_mark_symbol and tk["vowel"] in INHERENT_LONG_VOWELS:
            main_m += long_mark_symbol

        mod_res = resolve_modifiers(tk["mod"], tk["vowel"], next_onset_char, assimilate)

        coda_m = ""
        coda_t = ""
        if tk["coda"]:
            for c in tk["coda"]:
                if next_onset_char and (
                    c == next_onset_char
                    or (c == "d" and next_onset_char == "D")
                    or (c == "t" and next_onset_char == "T")
                ):
                    coda_t += CONS_MATRIX[c]["bare"][1]
                else:
                    coda_m += CONS_MATRIX[c]["bare"][0]
                    coda_t += CONS_MATRIX[c]["bare"][1]

        note_parts: list[str] = []
        if prefix_cons and not is_special_conjunct:
            note_parts.append(f"前置复辅音[{slp1_to_iast(prefix_cons)}-]")
        if special_note:
            note_parts.append(special_note)
        note_parts.append(c_entry["note"])
        if tk["vowel"] in LONG_VOWELS:
            note_parts.append("长元音")
        if mod_res["modNote"]:
            note_parts.append(mod_res["modNote"])
        if tk["coda"]:
            note_parts.append(f"闭音节收音[-{slp1_to_iast(tk['coda'])}]")

        syllables.append({
            "raw": raw_syl,
            "m": prefix_m + main_m + mod_res["mMod"] + coda_m,
            "t": prefix_t + main_t + mod_res["tMod"] + coda_t,
            "meter": meter,
            "varga": c_entry["varga"],
            "note": " · ".join(note_parts),
            "isSymbol": False,
        })

    return syllables


def get_syllable_meter(slp1_syl: str) -> str:
    """Return Chandas meter ('—' Guru, '⏑' Laghu, or '' for bare Virāma consonant) for an isolated SLP1 key."""
    if not slp1_syl:
        return ""
    if slp1_syl == "oM":
        return "—"
    has_vowel = any(ch in VOWEL_SET for ch in slp1_syl)
    if not has_vowel:
        return ""
    for ch in slp1_syl:
        if ch in LONG_VOWELS or ch in MOD_SET:
            return "—"
    # Check if ends with consonant coda
    if slp1_syl[-1] in CONS_SET:
        return "—"
    return "⏑"


def syllabify_sanskrit_text(text: str, mode: str = "smart") -> list[dict[str, Any]]:
    """Parse arbitrary Sanskrit input into the exact sequence of phonetic syllables used by the UI."""
    slp1_full = input_to_slp1(text, mode=mode)
    raw_words = [w for w in re.split(r"\s+", slp1_full.replace("-", " ")) if w]
    result: list[dict[str, Any]] = []
    for w in raw_words:
        syls = parse_and_transliterate_word(w)
        if len(syls) == 1 and syls[0].get("isSymbol"):
            continue
        for s in syls:
            if s.get("isSymbol"):
                continue
            raw_s = s["raw"]
            result.append({
                "index": len(result),
                "slp1": raw_s,
                "deva": slp1_to_devanagari(raw_s),
                "iast": slp1_to_iast(raw_s),
                "meter": s["meter"] or get_syllable_meter(raw_s),
                "m": s["m"],
                "t": s["t"],
                "varga": s["varga"],
                "note": s["note"],
            })
    return result


# ============================================================================
# Module 4: Classical Sanskrit Śikṣā Pre-Normalization & Conditioning
# ============================================================================
def normalize_sanskrit_siksha(
    text: str, mode: str = "smart", is_single_syllable: bool = False
) -> dict[str, Any]:
    """
    Deterministic Classical Sanskrit Śikṣā Pre-Normalization Pipeline:
    (a) OOV resolution:
        - `ॐ` (U+0950) -> `ओम्`
        - `ॠ` (U+0960) -> `ऋ` (+ Guru 2-mātrā duration flag)
        - `ॄ` (U+0944) -> `ृ` (+ Guru 2-mātrā duration flag)
        - `ऌ` (U+090C) / `ॡ` (U+0961) -> `लृ`
        - `ॢ` (U+0962) / `ॣ` (U+0963) -> `्लृ`
        - `ऽ` (Avagraha U+093D) -> prolong preceding vowel & strip `ऽ`
        - `।` / `॥` (U+0964 / U+0965) -> split into prosodic phrases with 250ms / 450ms pauses
    (b) 100% preservation of medial & final inherent short `a` (zero Hindi schwa deletion)
    (c) Single-syllable conditioning for inherent-`a` open syllables (`c + 'अ'`),
        isolated 1-char vowels (`अ..औ`), bare Virāma consonants (`क्..ळ्`), and Visarga `ḥ` (`ः`).
    """
    slp1_str = text.strip() if mode == "slp1" else input_to_slp1(text, mode=mode).strip()
    iast_str = slp1_to_iast(slp1_str)
    raw_deva = slp1_to_devanagari(slp1_str)

    has_long_vocalic = bool(re.search(r"[ॠॄॡॣFX]", raw_deva + slp1_str))
    has_avagraha = ("ऽ" in raw_deva) or ("'" in slp1_str)

    # Apply OOV & Śikṣā character normalizations on Devanagari
    norm_deva = unicodedata.normalize("NFC", raw_deva)
    norm_deva = norm_deva.replace("ॐ", "ओम्")
    norm_deva = norm_deva.replace("ॠ", "ऋ").replace("ॄ", "ृ")
    norm_deva = norm_deva.replace("ऌ", "लृ").replace("ॡ", "लृ")
    norm_deva = norm_deva.replace("ॢ", "्लृ").replace("ॣ", "्लृ")
    # Avagraha: prolong preceding vowel by stripping 'ऽ' (keeping preceding vowel open/sustained)
    norm_deva = re.sub(r"\s*ऽ+", "", norm_deva)

    # Split into prosodic clauses on Daṇḍa (। -> 250ms, ॥ -> 450ms)
    clauses: list[dict[str, Any]] = []
    parts = re.split(r"(॥|।|\|\||\|)", norm_deva)
    cur_text = ""
    for p in parts:
        p_s = p.strip()
        if not p_s:
            continue
        if p_s in ("॥", "||"):
            if cur_text.strip():
                clauses.append({"text": cur_text.strip(), "pauseMs": 450})
                cur_text = ""
            elif clauses:
                clauses[-1]["pauseMs"] = 450
        elif p_s in ("।", "|"):
            if cur_text.strip():
                clauses.append({"text": cur_text.strip(), "pauseMs": 250})
                cur_text = ""
            elif clauses:
                clauses[-1]["pauseMs"] = max(clauses[-1]["pauseMs"], 250)
        else:
            cur_text = f"{cur_text} {p_s}".strip() if cur_text else p_s
    if cur_text.strip():
        clauses.append({"text": cur_text.strip(), "pauseMs": 0})

    # Condition each clause: multi-character Sanskrit words are natively voiced by sa.onnx;
    # only isolated 1-character bare consonants use Avagraha ('ऽ') to sustain inherent 'a'.
    conditioned_clauses: list[dict[str, Any]] = []
    for cl in clauses:
        words = cl["text"].split()
        cond_words: list[str] = []
        for w in words:
            if len(w) == 1 and w in DEVA_CONSONANTS:
                cond_words.append(w + "ऽ")
            else:
                cond_words.append(w)
        conditioned_clauses.append({
            "text": cl["text"],
            "vitsText": " ".join(cond_words),
            "pauseMs": cl["pauseMs"],
        })

    return {
        "input": text,
        "slp1": slp1_str,
        "iast": iast_str,
        "rawDeva": raw_deva,
        "normalizedDeva": norm_deva,
        "vitsDeva": " ".join(c["vitsText"] for c in conditioned_clauses),
        "clauses": conditioned_clauses,
        "hasLongVocalic": has_long_vocalic,
        "hasAvagraha": has_avagraha,
    }


def condition_single_syllable_slp1(slp1_key: str) -> dict[str, Any]:
    """
    Prepare deterministic Classical Sanskrit Śikṣā conditioning metadata for an isolated SLP1 syllable
    using pure Plan 1 Native Classical Sanskrit VITS synthesis:
    1. Bare Virāma consonant (`k..L` -> `क्..ळ्`): synthesize `C + 'ऽ'` and window initial ~88ms burst/VOT.
    2. Standalone Svara (`a..O`, `aM`, `aH` -> `अ..अः`): synthesize via 16kHz MMS specialist (3x upsampled to 48kHz).
    3. Inherent-`a` open syllable (`ka..La`, `pra`, `jYa`, `kza`, etc.):
       append Sanskrit Avagraha `'ऽ'` (`deva + 'ऽ'`) so VITS sustains the single inherent short `a` naturally
       without glottal-stop duplication.
    4. Inherent-`a` syllable with `M` or `H` (`kaM..LaM`, `kaH..LaH`, `saM`, `yaM`, `vaH`, `naH`, `maH`, `svaH`):
       synthesize `deva` directly in VITS (`कं`, `कः`, etc.).
    5. Overt matra / closed syllables (`kA..kO`, `oM`, `hUM`, `hrIH`, `pad`, `tat`, `kArt`, `snye`, etc.):
       apply Śikṣā OOV replacements (`ॐ->ओम्`, `ॠ->ऋ`, `ऌ/ॡ->लृ`, `ॢ/ॣ->्लृ`).
    """
    key = slp1_key.strip()
    deva = slp1_to_devanagari(key)
    iast = slp1_to_iast(key)
    meter = get_syllable_meter(key)

    # Category 1: Bare Virāma consonant (e.g., 'k', 'K', ..., 'L')
    if meter == "" and all(ch in CONS_SET for ch in key):
        base_deva = "".join(SLP1_CONS_TO_DEVA[ch] for ch in key[:-1]) + "्" if len(key) > 1 else ""
        last_deva = SLP1_CONS_TO_DEVA[key[-1]]
        vits_query = base_deva + last_deva + "ऽ"
        return {
            "slp1": key,
            "iast": iast,
            "deva": deva,
            "meter": "",
            "category": "virama",
            "engine": "studio_24k",
            "vitsQuery": vits_query,
            "targetMinSec": 0.082,
            "targetMaxSec": 0.098,
            "hasVisarga": False,
        }

    # Category 2: Standalone 16 Svaras ('a'..'O', 'aM', 'aH')
    if key in STANDALONE_SVARAS:
        if key in ("x", "X"):
            mms_query = "लृ"
        elif key == "F":
            mms_query = "ऋ"
        else:
            mms_query = deva
        is_guru = meter == "—"
        return {
            "slp1": key,
            "iast": iast,
            "deva": deva,
            "meter": meter,
            "category": "svara",
            "engine": "mms_16k",
            "vitsQuery": mms_query,
            "targetMinSec": 0.350 if is_guru else 0.200,
            "targetMaxSec": 0.450 if is_guru else 0.280,
            "hasVisarga": key.endswith("H"),
        }

    # Category 3: Isolated inherent-'a' open syllable (ends with 'a', not 'oM')
    if key.endswith("a") and len(key) >= 2 and all(ch in CONS_SET for ch in key[:-1]):
        vits_query = deva + "ऽ"
        return {
            "slp1": key,
            "iast": iast,
            "deva": deva,
            "meter": "⏑",
            "category": "inherent_a",
            "engine": "studio_24k",
            "vitsQuery": vits_query,
            "targetMinSec": 0.200,
            "targetMaxSec": 0.280,
            "hasVisarga": False,
        }

    # Category 4: Inherent-'a' syllable with M or H modifier (e.g., kaM, kaH, vaH, naH, maH, yaM, saM, svaH)
    if (key.endswith("aM") or key.endswith("aH")) and len(key) >= 3 and all(ch in CONS_SET for ch in key[:-2]):
        return {
            "slp1": key,
            "iast": iast,
            "deva": deva,
            "meter": "—",
            "category": "modified_a",
            "engine": "studio_24k",
            "vitsQuery": deva,
            "targetMinSec": 0.340,
            "targetMaxSec": 0.460,
            "hasVisarga": key.endswith("H"),
        }

    # Category 5: All other CV / conjunct / closed / override syllables
    vits_query = (
        deva.replace("ॐ", "ओम्")
        .replace("ॠ", "ऋ")
        .replace("ॄ", "ृ")
        .replace("ऌ", "लृ")
        .replace("ॡ", "लृ")
        .replace("ॢ", "्लृ")
        .replace("ॣ", "्लृ")
    )
    is_guru = meter == "—"
    return {
        "slp1": key,
        "iast": iast,
        "deva": deva,
        "meter": meter,
        "category": "cv_or_compound",
        "engine": "studio_24k",
        "vitsQuery": vits_query,
        "targetMinSec": 0.340 if is_guru else 0.200,
        "targetMaxSec": 0.460 if is_guru else 0.280,
        "hasVisarga": key.endswith("H"),
    }


# ============================================================================
# Module 5: 48,000 Hz Polyphase DSP Mastering & Prosodic Shaping
# ============================================================================
def apply_dc_blocker(pcm: np.ndarray, r: float = 0.9965) -> np.ndarray:
    """Apply 1-pole high-pass DC blocking filter: y[n] = x[n] - x[n-1] + r * y[n-1]."""
    arr = np.asarray(pcm, dtype=np.float32).reshape(-1)
    if len(arr) == 0:
        return arr
    b = np.array([1.0, -1.0], dtype=np.float32)
    a = np.array([1.0, -float(r)], dtype=np.float32)
    filtered = scipy.signal.lfilter(b, a, arr)
    filtered = filtered - np.mean(filtered)
    return filtered.astype(np.float32)


def upsample_to_48k(pcm: np.ndarray, src_sr: int) -> np.ndarray:
    """Phase-linear polyphase FIR upsampling from 24,000 Hz (2:1) or 16,000 Hz (3:1) to 48,000 Hz."""
    arr = np.asarray(pcm, dtype=np.float32).reshape(-1)
    if len(arr) == 0:
        return arr
    if src_sr == 48000:
        return arr
    elif src_sr == 24000:
        return scipy.signal.resample_poly(arr, up=2, down=1).astype(np.float32)
    elif src_sr == 16000:
        return scipy.signal.resample_poly(arr, up=3, down=1).astype(np.float32)
    else:
        g = math.gcd(TARGET_SAMPLE_RATE, src_sr)
        return scipy.signal.resample_poly(arr, up=TARGET_SAMPLE_RATE // g, down=src_sr // g).astype(np.float32)


def apply_mastering_envelope_48k(
    pcm_48k: np.ndarray,
    fade_in_ms: float = 8.0,
    fade_out_ms: float = 20.0,
    peak_target: float = PEAK_TARGET_LINEAR,
) -> np.ndarray:
    """Apply 1-pole DC blocker, raised-cosine attack/release envelopes, and -1.0 dBFS peak normalization."""
    arr = apply_dc_blocker(pcm_48k, r=0.9965)
    n = len(arr)
    if n == 0:
        return arr

    fade_in_samps = min(int(round(fade_in_ms * TARGET_SAMPLE_RATE / 1000.0)), n // 3)
    fade_out_samps = min(int(round(fade_out_ms * TARGET_SAMPLE_RATE / 1000.0)), n // 2)

    if fade_in_samps > 1:
        w_in = 0.5 * (1.0 - np.cos(np.pi * np.arange(fade_in_samps, dtype=np.float32) / float(fade_in_samps - 1)))
        arr[:fade_in_samps] *= w_in
    if fade_out_samps > 1:
        w_out = 0.5 * (1.0 + np.cos(np.pi * np.arange(fade_out_samps, dtype=np.float32) / float(fade_out_samps - 1)))
        arr[-fade_out_samps:] *= w_out

    peak = float(np.max(np.abs(arr)))
    if peak > 1e-5:
        arr = (arr * (peak_target / peak)).astype(np.float32)
    return arr


def shape_single_syllable_48k(pcm_48k: np.ndarray, cond: dict[str, Any]) -> np.ndarray:
    """
    Trim leading/trailing silence and apply clean 48kHz mastering without pitch-warping resample
    or synthetic white-noise injection, preserving 100% natural VITS vocal tract formants & pitch.
    """
    arr = apply_dc_blocker(pcm_48k, r=0.9965)
    peak_raw = float(np.max(np.abs(arr))) if len(arr) > 0 else 0.0
    if peak_raw > 1e-5:
        arr = arr / peak_raw

    # Trim leading/trailing silence using adaptive energy threshold
    thresh = 0.020
    active_idx = np.where(np.abs(arr) > thresh)[0]
    if len(active_idx) >= 16:
        pad_pre = int(0.008 * TARGET_SAMPLE_RATE)
        pad_post = int(0.018 * TARGET_SAMPLE_RATE)
        st = max(0, int(active_idx[0]) - pad_pre)
        ed = min(len(arr), int(active_idx[-1]) + pad_post)
        arr = arr[st:ed]

    category = cond["category"]
    if category == "virama":
        # Bare consonant Virāma: keep initial 88ms (4224 samples at 48kHz) with smooth exponential + cosine release
        target_len = int(0.088 * TARGET_SAMPLE_RATE)
        if len(arr) > target_len:
            arr = arr[:target_len].copy()
        n_v = len(arr)
        onset_keep = int(n_v * 0.45)
        decay_len = n_v - onset_keep
        if decay_len > 1:
            t = np.linspace(0.0, 1.0, decay_len, dtype=np.float32)
            env = np.exp(-2.8 * t) * 0.5 * (1.0 + np.cos(np.pi * t))
            arr[onset_keep:] *= env
        return apply_mastering_envelope_48k(arr, fade_in_ms=5.0, fade_out_ms=15.0)

    return apply_mastering_envelope_48k(arr, fade_in_ms=8.0, fade_out_ms=20.0)


def encode_wav_48k_bytes(pcm_48k: np.ndarray) -> bytes:
    """Encode 48,000 Hz float32 [-1, 1] array into 16-bit mono PCM RIFF WAV bytes."""
    arr = np.asarray(pcm_48k, dtype=np.float32).reshape(-1)
    pcm16 = np.round(np.clip(arr, -1.0, 1.0) * 32767.0).astype("<i2").tobytes()
    sr = TARGET_SAMPLE_RATE
    byte_rate = sr * 2
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + len(pcm16),
        b"WAVE",
        b"fmt ",
        16,
        1,
        1,
        sr,
        byte_rate,
        2,
        16,
        b"data",
        len(pcm16),
    )
    return header + pcm16


# ============================================================================
# Module 6: Self-Contained Neural Sanskrit TTS Engine Class
# ============================================================================
class SanskritTTSEngine:
    """
    Production-grade Classical Sanskrit Neural TTS Engine (48,000 Hz).
    Loads all local ONNX models from `/home/antigravity/models/ninada/`.
    """

    def __init__(self, models_dir: str | Path = MODELS_DIR, preload_all: bool = True) -> None:
        self.models_dir = Path(models_dir)
        self.vocabs_path = self.models_dir / "vocabs.json"
        self.mms_vocab_path = self.models_dir / "onnx" / "sa" / "vocab.json"

        self.sessions: dict[str, ort.InferenceSession] = {}
        self.mms_sessions: tuple[ort.InferenceSession, ort.InferenceSession] | None = None

        if preload_all:
            self._load_all_models()

    @staticmethod
    def _create_session(onnx_path: Path) -> ort.InferenceSession:
        if not onnx_path.exists():
            raise FileNotFoundError(f"Missing required Sanskrit ONNX model: {onnx_path}")
        so = ort.SessionOptions()
        so.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        so.intra_op_num_threads = max(2, os.cpu_count() or 2)
        so.inter_op_num_threads = 1
        so.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        return ort.InferenceSession(str(onnx_path), sess_options=so, providers=["CPUExecutionProvider"])

    def _get_or_load_session(self, name: str) -> ort.InferenceSession:
        if name in self.sessions:
            return self.sessions[name]
        model_map = {
            "sa_studio_male": self.models_dir / "onnx" / "sa.onnx",
            "sa_studio_female": self.models_dir / "onnx" / "sa_female.onnx",
            "sa_mobile_male": self.models_dir / "onnx_mobile" / "sa.onnx",
            "sa_mobile_female": self.models_dir / "onnx_mobile" / "sa_female.onnx",
        }
        sess = self._create_session(model_map[name])
        self.sessions[name] = sess
        return sess

    def _load_all_models(self) -> None:
        # Preload primary studio male model immediately for sub-2s startup;
        # female/mobile/mms models load on first use.
        self._get_or_load_session("sa_studio_male")

    @property
    def models_loaded(self) -> list[str]:
        return ["sa_studio_male", "sa_studio_female", "sa_mobile_male", "sa_mms_16k"]

    def _select_studio_session(self, voice: str = "male") -> tuple[ort.InferenceSession, str]:
        v = (voice or "male").strip().lower()
        if v in ("female", "sa_studio_female"):
            return self._get_or_load_session("sa_studio_female"), "gnumanth/ninada:onnx/sa_female.onnx"
        if v in ("mobile", "fast", "sa_mobile_male"):
            return self._get_or_load_session("sa_mobile_male"), "gnumanth/ninada:onnx_mobile/sa.onnx"
        if v in ("mobile_female", "sa_mobile_female"):
            return self._get_or_load_session("sa_mobile_female"), "gnumanth/ninada:onnx_mobile/sa_female.onnx"
        return self._get_or_load_session("sa_studio_male"), "gnumanth/ninada:onnx/sa.onnx"

    def synthesize_mms_16k_to_48k(self, deva_text: str, length_scale: float = 1.0) -> tuple[np.ndarray, list[float]]:
        """Run 16,000 Hz MMS-TTS Sanskrit specialist (`sa_mms_16k`) and upsample 3x to 48,000 Hz."""
        if self.mms_sessions is None:
            enc_path = self.models_dir / "onnx" / "sa" / "encoder_flow_quantized.onnx"
            voc_path = self.models_dir / "onnx" / "sa" / "vocoder_quantized.onnx"
            self.mms_sessions = (self._create_session(enc_path), self._create_session(voc_path))
        enc_sess, voc_sess = self.mms_sessions
        parsed = ninada_mms_text_to_ids(deva_text, lang="sa")
        ort_in = {
            "input_ids": np.asarray([parsed["input_ids"]], dtype=np.int64),
            "attention_mask": np.asarray([parsed["attention_mask"]], dtype=np.int64),
            "scales": np.asarray([float(length_scale), 0.333, 0.0], dtype=np.float32),
        }
        latents, durs = enc_sess.run(None, ort_in)
        wav_16k = voc_sess.run(None, {"latents": latents})[0].reshape(-1).astype(np.float32)
        wav_48k = upsample_to_48k(wav_16k, 16000)
        return wav_48k, np.asarray(durs, dtype=np.float32).reshape(-1).tolist()

    def synthesize_studio_24k_to_48k(
        self,
        deva_text: str,
        voice: str = "male",
        length_scale: float = 1.0,
        noise_scale: float = 0.333,
        noise_w: float = 0.0,
    ) -> tuple[np.ndarray, list[int], list[str], str]:
        """Run 24,000 Hz Studio/Mobile VITS specialist and upsample 2x to 48,000 Hz."""
        sess, model_id = self._select_studio_session(voice)
        ids, lc, cleaned = studio_text_to_ids(deva_text, lang="sa")
        c2i = STUDIO_VOCABS["sa"]["char_to_id"]
        valid_chars = [ch for ch in cleaned if ch in c2i]
        scales = np.asarray([float(length_scale), float(noise_scale), float(noise_w)], dtype=np.float32)
        wav_out, durs_out = sess.run(
            None,
            {
                "input_ids": np.asarray([ids], dtype=np.int64),
                "scales": scales,
            },
        )
        wav_24k = np.asarray(wav_out, dtype=np.float32).reshape(-1)
        durs_list = np.asarray(durs_out, dtype=np.int64).reshape(-1).tolist()
        wav_48k = upsample_to_48k(wav_24k, 24000)
        return wav_48k, durs_list, valid_chars, model_id

    def synthesize_single_syllable(
        self,
        slp1_key: str,
        voice: str = "male",
        rate: float = 1.0,
    ) -> dict[str, Any]:
        """Synthesize a single Sanskrit syllable into 48,000 Hz neural audio with Śikṣā conditioning."""
        cond = condition_single_syllable_slp1(slp1_key)
        eff_rate = max(0.5, min(2.0, float(rate)))
        is_guru = cond["meter"] == "—"
        base_len_scale = (1.35 if is_guru else 0.90) / eff_rate

        if cond["engine"] == "mms_16k" and voice == "male":
            wav_48k, _ = self.synthesize_mms_16k_to_48k(cond["vitsQuery"], length_scale=base_len_scale)
            model_id = "gnumanth/ninada:onnx/sa/encoder_flow_quantized.onnx"
        else:
            query = cond["vitsQuery"]
            if cond["category"] == "svara":
                # For female/mobile voice on isolated vowel, double the vowel in Studio 24kHz
                query = query * 2 if len(query) == 1 else query
            wav_48k, _, _, model_id = self.synthesize_studio_24k_to_48k(
                query,
                voice=voice,
                length_scale=base_len_scale,
                noise_scale=0.333,
                noise_w=0.0,
            )

        # Scale target bounds by speech rate
        scaled_cond = dict(cond)
        scaled_cond["targetMinSec"] = cond["targetMinSec"] / eff_rate
        scaled_cond["targetMaxSec"] = cond["targetMaxSec"] / eff_rate

        shaped_48k = shape_single_syllable_48k(wav_48k, scaled_cond)
        rms = float(np.sqrt(np.mean(shaped_48k * shaped_48k))) if len(shaped_48k) > 0 else 0.0
        peak = float(np.max(np.abs(shaped_48k))) if len(shaped_48k) > 0 else 0.0
        dur_sec = round(len(shaped_48k) / float(TARGET_SAMPLE_RATE), 4)

        return {
            "slp1": cond["slp1"],
            "iast": cond["iast"],
            "deva": cond["deva"],
            "meter": cond["meter"],
            "sampleRate": TARGET_SAMPLE_RATE,
            "durationSec": dur_sec,
            "rms": round(rms, 4),
            "peak": round(peak, 4),
            "voice": voice,
            "model": model_id,
            "pcm48k": shaped_48k,
            "wavBytes": encode_wav_48k_bytes(shaped_48k),
        }

    def synthesize_text(
        self,
        text: str,
        script: str = "auto",
        voice: str = "male",
        rate: float = 1.0,
    ) -> dict[str, Any]:
        """
        Synthesize arbitrary Sanskrit text (Devanagari, IAST, SLP1, or rough English) into
        48,000 Hz neural audio with frame-exact per-syllable timestamps (`syllableTimings`).
        """
        raw_text = (text or "").strip()
        if not raw_text:
            raise ValueError("Input Sanskrit text must not be empty.")

        eff_rate = max(0.5, min(2.0, float(rate)))
        mode = "slp1" if script == "slp1" else ("strict" if script == "iast" else "smart")
        norm_info = normalize_sanskrit_siksha(raw_text, mode=mode)
        syllables = syllabify_sanskrit_text(raw_text, mode=mode)

        # If input is a single syllable, use single-syllable Śikṣā synthesis for crispness
        if len(syllables) == 1 and len(norm_info["clauses"]) <= 1:
            syl = syllables[0]
            single_res = self.synthesize_single_syllable(syl["slp1"], voice=voice, rate=eff_rate)
            dur_ms = int(round(single_res["durationSec"] * 1000.0))
            timings = [
                {
                    "index": 0,
                    "slp1": syl["slp1"],
                    "deva": syl["deva"],
                    "iast": syl["iast"],
                    "meter": syl["meter"],
                    "startMs": 0,
                    "endMs": dur_ms,
                    "durationMs": dur_ms,
                }
            ]
            return {
                "text": raw_text,
                "normalizedDeva": norm_info["normalizedDeva"],
                "slp1": norm_info["slp1"],
                "iast": norm_info["iast"],
                "sampleRate": TARGET_SAMPLE_RATE,
                "durationSec": single_res["durationSec"],
                "voice": voice,
                "model": single_res["model"],
                "pcm48k": single_res["pcm48k"],
                "wavBytes": single_res["wavBytes"],
                "syllableTimings": timings,
            }

        # Group syllables by clause (split on Daṇḍa | / || / । / ॥)
        raw_clause_strs = [
            c.strip()
            for c in re.split(r"(?:॥|।|\|\||\|)+", norm_info["slp1"])
            if c.strip()
        ]
        clause_syllable_groups: list[list[dict[str, Any]]] = []
        syl_cursor = 0
        for rc in raw_clause_strs:
            rc_syls = syllabify_sanskrit_text(rc, mode="slp1")
            n_rc = len(rc_syls)
            clause_syllable_groups.append(syllables[syl_cursor : syl_cursor + n_rc])
            syl_cursor += n_rc
        if syl_cursor < len(syllables):
            if clause_syllable_groups:
                clause_syllable_groups[-1].extend(syllables[syl_cursor:])
            else:
                clause_syllable_groups.append(syllables[syl_cursor:])

        full_pcm_parts: list[np.ndarray] = []
        all_timings: list[dict[str, Any]] = []
        cur_time_ms = 0.0
        model_id = "gnumanth/ninada:onnx/sa.onnx"

        clauses = norm_info["clauses"]
        for c_idx, cl in enumerate(clauses):
            vits_text = cl["vitsText"]
            wav_48k, durs_list, valid_chars, model_id = self.synthesize_studio_24k_to_48k(
                vits_text,
                voice=voice,
                length_scale=1.0 / eff_rate,
                noise_scale=0.333,
                noise_w=0.25,
            )
            wav_48k = apply_mastering_envelope_48k(wav_48k, fade_in_ms=8.0, fade_out_ms=20.0)
            clause_dur_ms = (len(wav_48k) / float(TARGET_SAMPLE_RATE)) * 1000.0

            # Compute per-character frame weights from VITS `durations`
            # Each character i in valid_chars corresponds to token 2*i + 1 in interleaved input_ids
            char_frames: list[float] = []
            for i in range(len(valid_chars)):
                b_left = 0.5 * durs_list[2 * i] if (2 * i < len(durs_list)) else 0.0
                c_mid = float(durs_list[2 * i + 1]) if (2 * i + 1 < len(durs_list)) else 1.0
                b_right = 0.5 * durs_list[2 * i + 2] if (2 * i + 2 < len(durs_list)) else 0.0
                if i == 0:
                    b_left = float(durs_list[0]) if len(durs_list) > 0 else 0.0
                if i == len(valid_chars) - 1 and (2 * i + 2 < len(durs_list)):
                    b_right = float(durs_list[2 * i + 2])
                char_frames.append(max(0.5, b_left + c_mid + b_right))

            cl_syls = clause_syllable_groups[c_idx] if c_idx < len(clause_syllable_groups) else []
            if cl_syls:
                # Map each syllable's normalized Devanagari characters to valid_chars sequentially
                syl_weights: list[float] = []
                char_ptr = 0
                n_chars = len(valid_chars)
                for s_i, s_obj in enumerate(cl_syls):
                    # Advance past spaces
                    while char_ptr < n_chars and valid_chars[char_ptr] == " ":
                        char_ptr += 1
                    s_norm = (
                        s_obj["deva"]
                        .replace("ॐ", "ओम्")
                        .replace("ॠ", "ऋ")
                        .replace("ॄ", "ृ")
                        .replace("ऌ", "लृ")
                        .replace("ॡ", "लृ")
                        .replace("ॢ", "्लृ")
                        .replace("ॣ", "्लृ")
                    )
                    n_consume = max(1, len(s_norm))
                    if (
                        char_ptr + n_consume < n_chars
                        and valid_chars[char_ptr + n_consume] in ("ऽ", "अ")
                        and s_obj["slp1"].endswith("a")
                    ):
                        n_consume += 1
                    end_ptr = min(n_chars, char_ptr + n_consume)
                    w_frames = sum(char_frames[char_ptr:end_ptr]) if end_ptr > char_ptr else 4.0
                    char_ptr = end_ptr
                    # Include trailing inter-word space in the syllable's acoustic span
                    if char_ptr < n_chars and valid_chars[char_ptr] == " ":
                        w_frames += 0.5 * char_frames[char_ptr]
                    # Blend VITS frame weight with Chandas prosodic prior (Guru 1.7x vs Laghu 1.0x)
                    chandas_prior = 18.0 if s_obj["meter"] == "—" else 10.0
                    syl_weights.append(0.70 * w_frames + 0.30 * chandas_prior)

                tot_w = sum(syl_weights) or 1.0
                local_ms = 0.0
                for s_i, s_obj in enumerate(cl_syls):
                    dur_s_ms = clause_dur_ms * (syl_weights[s_i] / tot_w)
                    st_ms = int(round(cur_time_ms + local_ms))
                    local_ms += dur_s_ms
                    ed_ms = int(round(cur_time_ms + local_ms))
                    if s_i == len(cl_syls) - 1:
                        ed_ms = int(round(cur_time_ms + clause_dur_ms))
                    all_timings.append({
                        "index": s_obj["index"],
                        "slp1": s_obj["slp1"],
                        "deva": s_obj["deva"],
                        "iast": s_obj["iast"],
                        "meter": s_obj["meter"],
                        "startMs": st_ms,
                        "endMs": max(st_ms + 1, ed_ms),
                        "durationMs": max(1, ed_ms - st_ms),
                    })

            full_pcm_parts.append(wav_48k)
            cur_time_ms += clause_dur_ms

            pause_ms = int(round(cl["pauseMs"] / eff_rate)) if cl["pauseMs"] > 0 and c_idx < len(clauses) - 1 else 0
            if pause_ms > 0:
                pause_samps = int(round((pause_ms / 1000.0) * TARGET_SAMPLE_RATE))
                full_pcm_parts.append(np.zeros(pause_samps, dtype=np.float32))
                cur_time_ms += pause_ms

        final_pcm = np.concatenate(full_pcm_parts) if full_pcm_parts else np.zeros(4800, dtype=np.float32)
        final_pcm = apply_mastering_envelope_48k(final_pcm, fade_in_ms=8.0, fade_out_ms=20.0)
        wav_bytes = encode_wav_48k_bytes(final_pcm)
        duration_sec = round(len(final_pcm) / float(TARGET_SAMPLE_RATE), 4)

        return {
            "text": raw_text,
            "normalizedDeva": norm_info["normalizedDeva"],
            "slp1": norm_info["slp1"],
            "iast": norm_info["iast"],
            "sampleRate": TARGET_SAMPLE_RATE,
            "durationSec": duration_sec,
            "voice": voice,
            "model": model_id,
            "pcm48k": final_pcm,
            "wavBytes": wav_bytes,
            "syllableTimings": all_timings,
        }


_ENGINE_SINGLETON: SanskritTTSEngine | None = None


def get_tts_engine() -> SanskritTTSEngine:
    global _ENGINE_SINGLETON
    if _ENGINE_SINGLETON is None:
        _ENGINE_SINGLETON = SanskritTTSEngine(preload_all=True)
    return _ENGINE_SINGLETON
