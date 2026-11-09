import React from 'react';
import type { DharaniItem } from '../types/dharani';

interface AuthoritativeSourceModalProps {
  dharani: DharaniItem | null;
  onClose: () => void;
}

export const AuthoritativeSourceModal: React.FC<AuthoritativeSourceModalProps> = ({
  dharani,
  onClose,
}) => {
  if (!dharani) return null;
  const src = dharani.authoritativeSource;
  const crossRefEntries = Object.entries(src.crossRefs || {}).filter(
    ([, val]) => val !== undefined && (Array.isArray(val) ? val.length > 0 : Boolean(val))
  );

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`${dharani.shortTitleZh} 權威文獻溯源`}
      onClick={onClose}
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="workbench-header-row">
          <div>
            <div className="pill-group" style={{ marginBottom: '0.35rem' }}>
              <span className="db-badge">權威文獻校勘溯源 · Canonical Source Provenance</span>
              <span className="db-badge">{dharani.taishoId}</span>
              {src.gretilId && <span className="db-badge">{src.gretilId}</span>}
            </div>
            <h3 className="workbench-title">
              {dharani.titleZh} ({dharani.titleSanskrit})
            </h3>
          </div>
          <button type="button" onClick={onClose} className="pill-btn">
            ✕ 關閉視窗 (Close)
          </button>
        </div>

        <div className="two-col-grid" style={{ marginTop: '0.75rem' }}>
          <div className="script-summary-box">
            <div className="hit-subtitle">CBETA TEI-P5 佛典數位底本路徑</div>
            <code>
              {src.cbetaXmlId} {src.taishoLocation ? `(${src.taishoLocation})` : ''}
            </code>
            <div style={{ marginTop: '0.35rem' }}>
              <a href={src.cbetaRawUrl} target="_blank" rel="noreferrer">
                開啟 CBETA GitHub TEI-P5 原始 XML ↗
              </a>
            </div>
          </div>

          <div className="script-summary-box">
            <div className="hit-subtitle">GRETIL 哥廷根大學梵文電子文庫底本</div>
            <code>{src.gretilId || 'GRETIL Canonical Edition'}</code>
            <div className="hit-subtitle">{src.sanskritEditionCitation}</div>
            {src.gretilRawUrl && (
              <div style={{ marginTop: '0.35rem' }}>
                <a href={src.gretilRawUrl} target="_blank" rel="noreferrer">
                  開啟 GRETIL 梵文校勘本 ↗
                </a>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '0.9rem' }}>
          <h4 className="section-heading">
            1. 原始底本與梵漢對音平行摘錄 (Verbatim TEI-P5 & Sanskrit Edition Excerpt)
          </h4>
          <pre className="json-preview">{src.rawExcerpt}</pre>
        </div>

        <div style={{ marginTop: '0.9rem' }}>
          <h4 className="section-heading">
            2. 唐代譯場梵漢對音夾注考證 ({dharani.translator} · {dharani.period})
          </h4>
          <div className="search-results-list">
            {src.tangPhoneticNotes.map((note, idx) => (
              <div key={idx} className="search-hit-item">
                <strong style={{ color: '#fbbf24', marginRight: '0.45rem' }}>[{idx + 1}]</strong>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '0.9rem' }}>
          <h4 className="section-heading">3. 跨十二大國際佛典語料庫平行文獻參照 (Cross-Corpus Concordance)</h4>
          <div className="preset-chips">
            {crossRefEntries.map(([key, val]) => (
              <span key={key} className="script-tag">
                {key}: {Array.isArray(val) ? val.join(', ') : String(val)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AuthoritativeSourceModal;
