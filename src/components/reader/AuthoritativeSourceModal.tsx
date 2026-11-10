import React from 'react';
import { X, ExternalLink, ShieldCheck, FileCode } from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';

interface AuthoritativeSourceModalProps {
  entry: DharaniEntry;
  onClose: () => void;
}

export const AuthoritativeSourceModal: React.FC<AuthoritativeSourceModalProps> = ({
  entry,
  onClose,
}) => {
  const { provenance } = entry;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--accent-vermilion)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              权威学术原典数据溯源核验 · {entry.titleZh}
            </h3>
          </div>
          <button
            id="close-provenance-modal-btn"
            type="button"
            className="btn-scholarly"
            onClick={onClose}
          >
            <X size={16} />
            <span>关闭</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="meta-box">
            <div className="meta-box-label">数据来源类型 (Provenance Classification)</div>
            <div style={{ fontWeight: 600, color: 'var(--accent-vermilion)' }}>
              {provenance.sourceType} · 大正藏编号：{entry.taishoNo}
            </div>
          </div>

          <div className="meta-box">
            <div className="meta-box-label">版本与学术校勘出处 (Critical Edition Citation)</div>
            <div style={{ fontFamily: 'var(--font-iast)', fontSize: '0.92rem' }}>
              {provenance.editionCitation}
            </div>
          </div>

          <div className="meta-box">
            <div className="meta-box-label">本地已下载原典与校勘说明</div>
            <div>{provenance.manuscriptNotesZh}</div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {provenance.cbetaOnlineUrl && (
              <a
                href={provenance.cbetaOnlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-scholarly primary"
              >
                <ExternalLink size={14} />
                <span>打开 CBETA Online 电子佛典阅读 ({provenance.cbetaId})</span>
              </a>
            )}
            {provenance.cbetaRawXmlUrl && (
              <a
                href={provenance.cbetaRawXmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-scholarly"
              >
                <FileCode size={14} />
                <span>核验 CBETA GitHub TEI-P5 原始 XML</span>
              </a>
            )}
            {provenance.gretilRawUrl && (
              <a
                href={provenance.gretilRawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-scholarly gold"
              >
                <ExternalLink size={14} />
                <span>核验德国哥廷根大学 GRETIL 梵文原典 ({provenance.gretilFile})</span>
              </a>
            )}
          </div>

          {provenance.rawSnippet && (
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.35rem',
                }}
              >
                本地已下载之权威原典报文摘要（Raw Downloaded Source Excerpt）：
              </div>
              <pre className="raw-code-block">{provenance.rawSnippet}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
