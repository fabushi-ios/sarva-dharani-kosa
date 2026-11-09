/**
 * CBETA 唐代原典 <cb:tt> 悉昙梵字与汉字逐字对音矩阵组件 (src/components/reader/CbetaSiddhamInterlinearView.tsx)
 *
 * 直接展示从 CBETA XML-P5 (T19n0974B 佛顶尊胜 470字、T20n1113B 大悲咒 334字、T20n1080 如意轮 89字、T19n1002 光明真言 23字、T16n0665 金光明 92字)
 * 提取的 <cb:tt> 悉昙梵汉逐字对音、唐代音注 (二合/引/去声/转舌) 与三藏法师原典夹注。
 */

import React from 'react';
import { Volume2, ExternalLink, Sparkles } from 'lucide-react';
import { CbetaScriptureRecord } from '../../data/generated/cbetaAuthRecords';
import { iastToSiddham } from '../../core/transliterator';
import { sanskritAudioEngine, AudioEngineMode } from '../../services/sanskritAudioEngine';

interface CbetaSiddhamInterlinearViewProps {
  record: CbetaScriptureRecord;
  audioMode: AudioEngineMode;
  speechRate: number;
}

export const CbetaSiddhamInterlinearView: React.FC<CbetaSiddhamInterlinearViewProps> = ({
  record,
  audioMode,
  speechRate
}) => {
  return (
    <div className="sdk-cbeta-interlinear-box">
      <div className="sdk-cbeta-interlinear-header">
        <div>
          <h3 className="sdk-cbeta-interlinear-title">
            <Sparkles size={16} />
            CBETA 唐代原典 <code>&lt;cb:tt&gt;</code> 悉昙梵汉逐字对音矩阵 · 《{record.title}》
          </h3>
          <p className="sdk-cbeta-interlinear-sub">
            经号：<strong>{record.id}</strong> ({record.translator}) · 共提取{' '}
            <strong>{record.ttPairCount}</strong> 组官方 <code>#SD-*</code> 悉昙梵字与唐音对译（点击任意字卡可独立试听梵音）
          </p>
        </div>
        <a
          href={record.rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sdk-raw-link-btn"
        >
          <ExternalLink size={13} />
          查看 CBETA 原始 XML
        </a>
      </div>

      <div className="sdk-tt-grid">
        {record.ttPairs.map((pair, idx) => {
          const unicodeSiddham = pair.iast ? iastToSiddham(pair.iast) : pair.siddhamChar;
          return (
            <button
              key={`${pair.sdCode}-${idx}`}
              type="button"
              onClick={() =>
                sanskritAudioEngine.playSingleSyllableIast(
                  pair.iast || 'oṃ',
                  audioMode,
                  speechRate
                )
              }
              className="sdk-tt-card"
              title={`点击试听 · CBETA 梵字码: #${pair.sdCode} | IAST: ${pair.iast || '—'}`}
            >
              <div className="sdk-tt-top-row">
                <span className="sdk-tt-index">#{idx + 1}</span>
                <span className="sdk-tt-sdcode">{pair.sdCode || 'TEI'}</span>
              </div>
              <div className="sdk-tt-siddham siddham-text">
                {unicodeSiddham || pair.siddhamChar || '𑖀'}
              </div>
              <div className="sdk-tt-iast">{pair.iast || '—'}</div>
              <div className="sdk-tt-zh">{pair.zhChar}</div>
              {pair.yinNote && (
                <div className="sdk-tt-yinnote" title="唐代原典读法音注 (<cb:yin><cb:sg>)">
                  {pair.yinNote}
                </div>
              )}
              {pair.inlineGloss && (
                <div className="sdk-tt-gloss" title={pair.inlineGloss}>
                  注：{pair.inlineGloss}
                </div>
              )}
              <span className="sdk-tt-speak-hint">
                <Volume2 size={11} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
