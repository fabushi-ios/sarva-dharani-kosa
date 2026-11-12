import React from 'react';
import { X, ExternalLink, ShieldCheck, FileCode, BookOpen } from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';
import { citationCheckFor } from '../../core/sources/entrySources';
import { COVERAGE_VARIANT } from '../../core/sources/textAlignment';
import { CITATION_STATUS_LABEL_ZH, SANSKRIT_STATUS_LABEL_ZH } from '../../core/sources/citationCheck';

interface AuthoritativeSourceModalProps {
  entry: DharaniEntry;
  onClose: () => void;
  onOpenFullText?: () => void;
}

export const AuthoritativeSourceModal: React.FC<AuthoritativeSourceModalProps> = ({
  entry,
  onClose,
  onOpenFullText,
}) => {
  const { provenance } = entry;
  const check = citationCheckFor(entry);

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

          {check && (
            <div className={`fulltext-check fulltext-check-${check.status}`}>
              <div className="meta-box-label">代码自动核对（汉字咒文 ↔ CBETA 原典，按读音比对）</div>
              <div>{CITATION_STATUS_LABEL_ZH[check.status]}</div>
              {check.cited.length > 0 && (
                <div style={{ marginTop: '0.3rem' }}>
                  所标经号：
                  {check.cited
                    .map((c) => `${c.id}${c.inCbeta ? ` 吻合 ${Math.round(c.coverage * 100)}%` : '（CBETA 无此经号）'}`)
                    .join('；')}
                </div>
              )}
              {check.best && check.best.coverage >= COVERAGE_VARIANT && (
                <div>
                  最吻合原典：{check.best.title}（{check.best.id}，{Math.round(check.best.coverage * 100)}%）
                  {!check.best.cited && ' — 由代码在全部已收原典中定位'}
                </div>
              )}
              {check.sanskrit && (
                <div style={{ marginTop: '0.3rem' }}>
                  梵文转写核对（IAST ↔ GRETIL 梵文原典）：{SANSKRIT_STATUS_LABEL_ZH[check.sanskrit.status]}
                  {check.sanskrit.best && check.sanskrit.best.coverage >= COVERAGE_VARIANT &&
                    `（${check.sanskrit.best.id}，${Math.round(check.sanskrit.best.coverage * 100)}%）`}
                </div>
              )}
            </div>
          )}

          {onOpenFullText && (
            <div>
              <button id="provenance-open-fulltext-btn" type="button" className="btn-scholarly gold" onClick={onOpenFullText}>
                <BookOpen size={14} />
                <span>查看原文全文（自动定位本咒所在段落）</span>
              </button>
            </div>
          )}

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
