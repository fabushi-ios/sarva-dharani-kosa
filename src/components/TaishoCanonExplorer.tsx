/**
 * Taishō Esoteric Canon (`T18–T21`, No. 848–1420), CBETA Siddhaṃ & GRETIL Explorer
 * (`src/components/TaishoCanonExplorer.tsx`)
 */

import React, { useState } from 'react';
import { GRETIL_TEXT_RECORDS } from '../data/generated/gretilAuthRecords';
import sanskritAudioEngine from '../services/audio/sanskritAudioEngine';
import {
  fetchAndParseTaishoXml,
  LiveParsedTaishoDharani,
  searchTaishoMikkyoIndex,
} from '../services/cbetaLiveService';
import { TaishoMikkyoEntry } from '../types/dharani';
import CbetaSiddhamInterlinearView from './CbetaSiddhamInterlinearView';

export const TaishoCanonExplorer: React.FC = () => {
  const [volume, setVolume] = useState<'ALL' | 'T18' | 'T19' | 'T20' | 'T21'>('ALL');
  const [query, setQuery] = useState('');
  const [parsedResult, setParsedResult] = useState<LiveParsedTaishoDharani | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredTaisho = searchTaishoMikkyoIndex(volume, query);

  const handleInspectScripture = async (entry: TaishoMikkyoEntry) => {
    setLoadingId(entry.taishoNo);
    const parsed = await fetchAndParseTaishoXml(entry);
    setParsedResult(parsed);
    setLoadingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Section 1: CBETA Siddhaṃ Interlinear Matrix */}
      <CbetaSiddhamInterlinearView />

      {/* Section 2: Taishō Mikkyō (T18–T21) Live XML Explorer */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/85 p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div>
            <h3 className="font-serif-cn text-lg font-bold text-amber-200">
              《大正新修大藏经》密教部 (T18–T21, No. 848–1420) 原典陀罗尼检索引擎
            </h3>
            <p className="text-xs text-stone-400">
              支持按册号检索密教部经轨，提取 `&lt;p cb:type="dharani"&gt;` 咒文段落，并直接通过方案 1 48kHz 梵文神经引擎朗读。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'T18', 'T19', 'T20', 'T21'] as const).map((vol) => (
              <button
                key={vol}
                type="button"
                onClick={() => setVolume(vol)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  volume === vol
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {vol === 'ALL' ? '全部四册 (T18–T21)' : `${vol} 密教部`}
              </button>
            ))}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索经号 / 经题 / 译者 / 咒文..."
              className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-1.5 text-xs text-stone-100"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredTaisho.map((item) => (
            <div
              key={item.taishoNo}
              className="flex flex-col justify-between rounded-xl border border-stone-800 bg-stone-950/80 p-4 hover:border-amber-500/40"
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono font-bold text-amber-300">
                    {item.taishoNo}
                  </span>
                  <span className="text-stone-400">
                    {item.dynasty} · {item.translator} ({item.fascicles}卷)
                  </span>
                </div>
                <h4 className="mt-2 font-serif-cn text-sm font-bold text-stone-100">
                  {item.titleZh}
                </h4>
                <p className="mt-0.5 truncate font-mono text-[11px] text-emerald-300/90">
                  {item.titleSanskrit}
                </p>
                <p className="mt-2 line-clamp-2 font-mono text-xs text-stone-300">
                  {item.sampleMantraIast}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-amber-200/80">
                  {item.sampleMantraTang}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2 pt-2 border-t border-stone-800/80">
                <button
                  type="button"
                  onClick={() =>
                    sanskritAudioEngine.speakText(item.sampleMantraIast, {
                      title: `${item.taishoNo} ${item.titleZh}`,
                    })
                  }
                  className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/30"
                >
                  🔊 48kHz 朗读代表咒
                </button>
                <button
                  type="button"
                  onClick={() => handleInspectScripture(item)}
                  className="rounded-lg bg-stone-800 px-2.5 py-1 text-xs text-stone-300 hover:bg-stone-700"
                >
                  {loadingId === item.taishoNo ? '解析中...' : '📄 解析 XML 原文'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Parsed XML Result Drawer */}
        {parsedResult && (
          <div className="mt-5 rounded-xl border border-emerald-500/40 bg-stone-950 p-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="text-xs font-bold text-emerald-300">
                已解析 {parsedResult.taishoNo} · {parsedResult.titleZh} ({parsedResult.translator})
              </div>
              <button
                type="button"
                onClick={() => setParsedResult(null)}
                className="text-xs text-stone-400 hover:text-stone-200"
              >
                收起 ✕
              </button>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              {parsedResult.dharaniParagraphs.map((p) => (
                <div key={p.index} className="rounded-lg border border-stone-800 bg-stone-900/70 p-3">
                  <div className="font-serif-cn text-amber-200">{p.chineseTranslit}</div>
                  <div className="mt-1 font-mono text-emerald-300">{p.reconstructedIast}</div>
                </div>
              ))}
              <pre className="mt-2 overflow-x-auto rounded-lg bg-black/60 p-3 font-mono text-[11px] text-stone-300">
                {parsedResult.rawXmlSnippet}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: GRETIL Buddhist Sanskrit Manuscript Catalog */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/85 p-5 shadow-xl">
        <h3 className="font-serif-cn text-lg font-bold text-emerald-300">
          德国哥廷根大学 GRETIL & 吉尔吉特现存梵文贝叶经校勘目录 ({GRETIL_TEXT_RECORDS.length} 部核心定本)
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {GRETIL_TEXT_RECORDS.map((rec) => (
            <div
              key={rec.gretilId}
              className="rounded-xl border border-stone-800 bg-stone-950/80 p-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-400">{rec.gretilId}</span>
                <span className="text-amber-300">对应大正藏：{rec.correspondingTaisho}</span>
              </div>
              <div className="mt-1 font-serif-cn text-sm font-bold text-stone-100">
                {rec.titleZh}
              </div>
              <div className="mt-0.5 font-mono text-stone-400">{rec.titleSanskrit}</div>
              <div className="mt-2 rounded bg-stone-900 p-2 font-deva text-sm text-amber-100">
                {rec.mantraExcerptDeva}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">{rec.sourcePublication}</span>
                <button
                  type="button"
                  onClick={() =>
                    sanskritAudioEngine.speakText(rec.mantraExcerptDeva, {
                      title: rec.titleZh,
                    })
                  }
                  className="rounded-lg bg-emerald-600/25 px-3 py-1 font-semibold text-emerald-200 hover:bg-emerald-600/40"
                >
                  🔊 48kHz 梵本吟诵
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaishoCanonExplorer;
