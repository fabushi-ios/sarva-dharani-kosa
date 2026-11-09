/**
 * 10-Layer Synchronized Dhāraṇī Reader (`src/components/DharaniReader.tsx`)
 * Displays full scripture metadata, authoritative provenance drawer trigger,
 * optional CBETA Siddhaṃ-Chinese `<cb:tt>` interlinear view toggle, and all verse blocks.
 */

import React, { useState } from 'react';
import sanskritAudioEngine from '../services/audio/sanskritAudioEngine';
import { DharaniEntry, DisplayLayerConfig } from '../types/dharani';
import CbetaSiddhamInterlinearView from './CbetaSiddhamInterlinearView';
import VerseBlock from './VerseBlock';

interface DharaniReaderProps {
  entry: DharaniEntry;
  layers: DisplayLayerConfig;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onOpenSourceModal: () => void;
}

export const DharaniReader: React.FC<DharaniReaderProps> = ({
  entry,
  layers,
  isBookmarked,
  onToggleBookmark,
  onOpenSourceModal,
}) => {
  const [showCbetaInterlinear, setShowCbetaInterlinear] = useState(false);

  const handleReciteFullDharani = async () => {
    const fullText = entry.verses.map((v) => v.devanagari || v.iast).join(' । ');
    await sanskritAudioEngine.speakText(fullText, {
      title: entry.titleZh,
    });
  };

  return (
    <div className="flex-1 space-y-5">
      {/* Scripture Hero Header Card */}
      <div className="rounded-2xl border border-amber-800/40 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/30 p-6 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
                大正藏 {entry.sourceMetadata.taishoId}
              </span>
              {entry.sourceMetadata.gretilId && (
                <span className="rounded-md border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                  GRETIL 梵本: {entry.sourceMetadata.gretilId}
                </span>
              )}
              <span className="text-xs text-stone-400">
                {entry.sourceMetadata.dynasty} · {entry.sourceMetadata.translator}
              </span>
            </div>

            <h2 className="font-serif-cn text-2xl font-bold text-amber-100">
              {entry.titleZh}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="font-mono text-emerald-300">{entry.titleSanskrit}</span>
              <span className="font-deva text-amber-200">{entry.titleDevanagari}</span>
              <span className="font-siddham text-lg text-amber-300">{entry.titleSiddham}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleReciteFullDharani}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 shadow-md hover:bg-amber-400 transition"
            >
              🔊 48kHz 神经模型全文恭诵
            </button>

            {entry.cbetaInterlinearId && (
              <button
                type="button"
                onClick={() => setShowCbetaInterlinear((v) => !v)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  showCbetaInterlinear
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                    : 'border-stone-700 bg-stone-800/80 text-stone-200 hover:border-amber-500/50'
                }`}
              >
                📜 {showCbetaInterlinear ? '返回十维分层视图' : '切换 CBETA 悉昙唐音逐字对勘'}
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSourceModal}
              className="rounded-xl border border-stone-700 bg-stone-800/80 px-3.5 py-2 text-xs font-medium text-stone-200 hover:border-amber-500/50"
            >
              🔍 查验 CBETA/GRETIL 权威原典报文
            </button>

            <button
              type="button"
              onClick={() => onToggleBookmark(entry.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                isBookmarked
                  ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                  : 'border-stone-700 bg-stone-800/80 text-stone-400 hover:text-stone-200'
              }`}
            >
              {isBookmarked ? '★ 已收藏' : '☆ 收藏'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 border-t border-stone-800/80 pt-3.5 text-xs text-stone-300 sm:grid-cols-2">
          <div>
            <span className="font-semibold text-amber-300">【本尊与典籍源流】</span>{' '}
            {entry.deityOrSubject} — {entry.summaryZh}
          </div>
          <div>
            <span className="font-semibold text-emerald-300">【功德利益与持诵法要】</span>{' '}
            {entry.benefitsZh}
          </div>
        </div>
      </div>

      {/* Optional CBETA Siddhaṃ Interlinear View */}
      {showCbetaInterlinear && entry.cbetaInterlinearId && (
        <CbetaSiddhamInterlinearView scriptureId={entry.cbetaInterlinearId} />
      )}

      {/* Synchronized Verse Blocks */}
      <div className="space-y-4">
        {entry.verses.map((verse) => (
          <VerseBlock
            key={verse.id}
            verse={verse}
            layers={layers}
            dharaniTitle={entry.titleZh}
          />
        ))}
      </div>
    </div>
  );
};

export default DharaniReader;
