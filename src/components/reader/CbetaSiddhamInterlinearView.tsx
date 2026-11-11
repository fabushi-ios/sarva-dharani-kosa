import React from 'react';
import { Sparkles, Volume2 } from 'lucide-react';
import type { CbetaInterlinearToken } from '../../data/kosa-generated/cbetaAuthRecords';
import { iastToSiddham } from '../../core/sanskrit/transliterator';

interface CbetaSiddhamInterlinearViewProps {
  cbetaId?: string;
  titleZh: string;
  tokens: CbetaInterlinearToken[];
  onPlaySyllable: (iast: string) => void;
}

export const CbetaSiddhamInterlinearView: React.FC<CbetaSiddhamInterlinearViewProps> = ({
  cbetaId,
  titleZh,
  tokens,
  onPlaySyllable,
}) => {
  return (
    <section className="cbeta-interlinear-panel" aria-label="CBETA 悉昙梵汉逐字对音矩阵">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.8rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.08rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={17} color="var(--accent-vermilion)" />
            <span>
              CBETA 权威原典《{cbetaId} · {titleZh}》悉昙梵字与汉文逐字对音矩阵（共 {tokens.length} 字元）
            </span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            直接解析自 <code>cbeta-org/xml-p5</code> 原典中的 <code>&lt;cb:tt&gt;</code> 梵汉对音标签与{' '}
            <code>cbeta_sanskrit.json</code> 官方悉昙字库（#SD-*），完整保留唐代三藏法师注音（二合、引、转舌）与原典夹注。点击任一字格可发声。
          </p>
        </div>
      </div>

      <div className="interlinear-tokens-grid">
        {tokens.map((tok, idx) => (
          <button
            key={`${cbetaId}-tt-${idx}`}
            type="button"
            className="interlinear-token-card"
            onClick={() => tok.iast && onPlaySyllable(tok.iast)}
            title={`CBETA 字码: ${tok.sdRefs.join(', ')} | 点击听取 ${tok.iast || tok.zh} 发音`}
          >
            <span className="it-index">#{idx + 1} · {tok.sdRefs[0] || 'SD'}</span>
            <span className="it-siddham">
              {tok.siddham || (tok.iast ? iastToSiddham(tok.iast) : '') || '𑖀'}
            </span>
            <span className="it-iast">{tok.iast || '—'}</span>
            <span className="it-zh">{tok.zh || '（梵符）'}</span>
            {tok.tangPronunciationNote && (
              <span className="it-note">唐注：{tok.tangPronunciationNote}</span>
            )}
            {tok.tangMeaningGloss && (
              <span className="it-gloss">{tok.tangMeaningGloss}</span>
            )}
            {tok.iast && (
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <Volume2 size={10} /> 发音
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
