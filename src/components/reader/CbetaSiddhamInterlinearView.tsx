import React, { useState } from 'react';
import type { CbetaAuthRecord, CbetaTtAlignment } from '../../types/dharani';
import { analyzeSanskritLine } from '../../core/prosody';
import { playSingleSyllable } from '../../services/sanskritAudioEngine';

interface CbetaSiddhamInterlinearViewProps {
  record: CbetaAuthRecord;
}

export const CbetaSiddhamInterlinearView: React.FC<CbetaSiddhamInterlinearViewProps> = ({
  record
}) => {
  const [selectedPairIdx, setSelectedPairIdx] = useState<number | null>(null);
  const [filterText, setFilterText] = useState('');

  const filteredPairs = record.ttAlignments.filter((p) => {
    if (!filterText.trim()) return true;
    const q = filterText.trim().toLowerCase();
    return (
      p.chineseZi.toLowerCase().includes(q) ||
      p.iast.toLowerCase().includes(q) ||
      p.siddhamRef.toLowerCase().includes(q) ||
      p.yinNotes.join(' ').toLowerCase().includes(q) ||
      (p.inlineCommentary && p.inlineCommentary.toLowerCase().includes(q))
    );
  });

  const handleClickPair = (pair: CbetaTtAlignment, idx: number) => {
    setSelectedPairIdx(idx);
    if (pair.iast) {
      const analyzed = analyzeSanskritLine(pair.iast, { mode: 'smart' });
      const firstSyl = analyzed.words[0]?.syllables[0];
      if (firstSyl) {
        void playSingleSyllable(firstSyl);
      }
    }
  };

  return (
    <section className="sdk-cbeta-tt-panel">
      <div className="sdk-cbeta-tt-header">
        <div>
          <h3 className="sdk-cbeta-tt-title">
            📜 CBETA TEI-P5 原典《{record.title}》({record.xmlId}) 悉昙梵汉逐字对音矩阵
          </h3>
          <p className="sdk-cbeta-tt-desc">
            以下 <strong>{record.ttAlignmentsCount}</strong> 组梵汉对音直接提取自 CBETA XML-P5 原典{' '}
            <code>&lt;cb:tt&gt;</code> 标签，并通过官方 <code>cbeta_sanskrit.json</code> (2,240 字表)
            将悉昙字码（如 <code>#SD-A5E5</code>）解析为标准 Unicode 悉昙梵字与 IAST 罗马转写。点击任意字卡可试听
            48kHz 神经 VITS / 136.1Hz 梵音。
          </p>
        </div>

        <div className="sdk-cbeta-tt-controls">
          <input
            type="text"
            className="sdk-tt-filter-input"
            placeholder="筛选汉字、IAST、悉昙码或音注(如 二合/引)..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <a
            href={record.rawXmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="sdk-link-pill"
          >
            🔗 查看 CBETA GitHub 原典 XML
          </a>
        </div>
      </div>

      {/* 逐字对音网格 */}
      <div className="sdk-tt-grid">
        {filteredPairs.map((pair, idx) => {
          const isSelected = selectedPairIdx === idx;
          const yinNoteStr = pair.yinNotes.join('·');
          return (
            <button
              key={`${pair.siddhamRef}-${idx}`}
              type="button"
              className={`sdk-tt-card ${isSelected ? 'active' : ''}`}
              onClick={() => handleClickPair(pair, idx)}
              title={`CBETA 码: ${pair.siddhamRef} | 点击发声`}
            >
              <span className="sdk-tt-index">#{pair.index}</span>
              <span className="sdk-tt-siddham" lang="sa-Sidd">
                {pair.siddhamUnicode || '𑖀'}
              </span>
              <span className="sdk-tt-iast">{pair.iast || '—'}</span>
              <span className="sdk-tt-zh">{pair.chineseZi}</span>
              {yinNoteStr && <span className="sdk-tt-yinnote">{yinNoteStr}</span>}
              {pair.inlineCommentary && (
                <span className="sdk-tt-gloss">{pair.inlineCommentary}</span>
              )}
              <span className="sdk-tt-sdcode">{pair.siddhamRef}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
