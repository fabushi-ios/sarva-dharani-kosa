/**
 * CBETA Tang Dynasty Siddhaṃ-Chinese `<cb:tt>` Interlinear Matrix View
 * (`src/components/CbetaSiddhamInterlinearView.tsx`)
 * Renders official `#SD-*` Siddhaṃ characters, Tang phonetic notes (`二合`, `引`, `转舌`),
 * and inline glosses from CBETA TEI-P5 XML (`T19n0974B`, `T20n1064`, `T20n1080`).
 */

import React, { useState } from 'react';
import { CBETA_SIDDHAM_RECORDS } from '../data/generated/cbetaAuthRecords';
import sanskritAudioEngine from '../services/audio/sanskritAudioEngine';

interface CbetaSiddhamInterlinearViewProps {
  scriptureId?: string;
}

export const CbetaSiddhamInterlinearView: React.FC<CbetaSiddhamInterlinearViewProps> = ({
  scriptureId,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    scriptureId || CBETA_SIDDHAM_RECORDS[0].scriptureId
  );

  const record =
    CBETA_SIDDHAM_RECORDS.find((r) => r.scriptureId === selectedId) ||
    CBETA_SIDDHAM_RECORDS[0];

  return (
    <div className="rounded-2xl border border-amber-700/40 bg-stone-900/90 p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
              CBETA TEI-P5 `&lt;cb:tt&gt;` 悉昙对音矩阵
            </span>
            <h3 className="font-serif-cn text-lg font-bold text-amber-100">
              {record.titleZh}
            </h3>
          </div>
          <p className="mt-1 text-xs text-stone-400">{record.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={record.scriptureId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-lg border border-stone-700 bg-stone-950 px-3 py-1.5 text-xs text-amber-200"
          >
            {CBETA_SIDDHAM_RECORDS.map((r) => (
              <option key={r.scriptureId} value={r.scriptureId}>
                {r.scriptureId} · {r.titleZh} ({r.pairCount} 组对音)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interlinear Cards Grid */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
        {record.pairs.map((pair) => (
          <button
            key={pair.index}
            type="button"
            data-slp1={pair.slp1}
            onClick={() => sanskritAudioEngine.playSyllable(pair.slp1)}
            className="flex flex-col items-center rounded-xl border border-stone-800 bg-stone-950/90 p-3 text-center transition hover:border-amber-500/60 hover:bg-stone-900"
          >
            <span className="text-[10px] font-mono text-stone-500">#{pair.gaijiId}</span>
            <span className="my-1 font-siddham text-3xl text-amber-300">{pair.siddham}</span>
            <span className="font-deva text-sm text-stone-200">{pair.deva}</span>
            <span className="font-mono text-xs font-semibold text-emerald-300">{pair.iast}</span>
            <span className="mt-1.5 font-serif-cn text-base font-bold text-amber-100">
              {pair.tangHanzi}
            </span>
            {pair.yinSgNote && (
              <span className="mt-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-300">
                {pair.yinSgNote}
              </span>
            )}
            {pair.inlineGloss && (
              <span className="mt-1 text-[10px] text-stone-400">「{pair.inlineGloss}」</span>
            )}
          </button>
        ))}
      </div>

      {/* Raw XML Snapshot */}
      <div className="mt-4 rounded-xl border border-stone-800 bg-stone-950 p-3">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-stone-400">
          <span>CBETA XML-P5 原始 `&lt;cb:tt&gt;` 报文快照 ({record.scriptureId}.xml)</span>
          <a
            href={record.cbetaXmlUrl}
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:underline"
          >
            打开 GitHub Raw XML 源文件 ↗
          </a>
        </div>
        <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-emerald-300/90">
          {record.rawXmlSnippet}
        </pre>
      </div>
    </div>
  );
};

export default CbetaSiddhamInterlinearView;
