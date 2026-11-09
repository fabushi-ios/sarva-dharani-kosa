/**
 * 权威原典报文核验抽屉弹窗 (src/components/reader/AuthoritativeSourceModal.tsx)
 *
 * 展示当前陀罗尼下载自 CBETA XML-P5 与德国哥廷根大学 GRETIL 的原始报文快照、学术底本引用及直达源文件链接。
 */

import React from 'react';
import { X, ExternalLink, FileCode, ShieldCheck } from 'lucide-react';
import { DharaniEntry } from '../../types/dharani';
import { CBETA_SCRIPTURE_RECORDS } from '../../data/generated/cbetaAuthRecords';
import { GRETIL_MANUSCRIPT_RECORDS } from '../../data/generated/gretilAuthRecords';

interface AuthoritativeSourceModalProps {
  entry: DharaniEntry;
  onClose: () => void;
}

export const AuthoritativeSourceModal: React.FC<AuthoritativeSourceModalProps> = ({
  entry,
  onClose
}) => {
  const cbetaRecord = CBETA_SCRIPTURE_RECORDS[entry.sourceMeta.cbetaXmlId];
  const gretilRecord = GRETIL_MANUSCRIPT_RECORDS.find(
    g => g.file === entry.sourceMeta.gretilId
  );

  return (
    <div className="sdk-modal-backdrop" onClick={onClose}>
      <div className="sdk-modal-panel" onClick={e => e.stopPropagation()}>
        <div className="sdk-modal-header">
          <div className="sdk-modal-title-wrap">
            <ShieldCheck size={20} className="sdk-verified-icon" />
            <div>
              <h3 className="sdk-modal-title">
                权威馆藏原始数据源核验 · 《{entry.titleZh}》
              </h3>
              <p className="sdk-modal-sub">
                所有梵文、悉昙字码与唐音夹注均源自国际开源佛典学术库，原始证据链完整可查
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="sdk-modal-close">
            <X size={18} />
          </button>
        </div>

        <div className="sdk-modal-body">
          <div className="sdk-source-meta-grid">
            <div className="sdk-source-meta-card">
              <div className="sdk-source-meta-label">CBETA 大正藏 TEI-P5 经号与册页</div>
              <div className="sdk-source-meta-value">
                {entry.sourceMeta.cbetaXmlId} ({entry.sourceMeta.taishoVolPage})
              </div>
              <div className="sdk-source-meta-sub">
                原典译者：{entry.sourceMeta.ancientTranslator}
              </div>
              <a
                href={entry.sourceMeta.cbetaRawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sdk-source-ext-link"
              >
                <ExternalLink size={13} />
                直达 CBETA XML-P5 原始经文仓库
              </a>
            </div>

            <div className="sdk-source-meta-card">
              <div className="sdk-source-meta-label">梵文贝叶经底本与学术校勘版本</div>
              <div className="sdk-source-meta-value">
                {entry.sourceMeta.sanskritEditionCitation}
              </div>
              {entry.sourceMeta.gretilRawUrl && (
                <a
                  href={entry.sourceMeta.gretilRawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sdk-source-ext-link"
                >
                  <ExternalLink size={13} />
                  直达德国哥廷根大学 GRETIL 梵文写本源文件 ({entry.sourceMeta.gretilId})
                </a>
              )}
            </div>
          </div>

          {entry.sourceMeta.tangPhoneticNotes.length > 0 && (
            <div className="sdk-source-block">
              <h4 className="sdk-source-block-title">唐代三藏原典梵音读法与本尊夹注摘录：</h4>
              <ul className="sdk-source-notes-list">
                {entry.sourceMeta.tangPhoneticNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {cbetaRecord && (
            <div className="sdk-source-block">
              <h4 className="sdk-source-block-title">
                <FileCode size={15} />
                本地存档 CBETA TEI-P5 原始 XML 节点快照 (<code>data/raw/cbeta/{cbetaRecord.id}.xml</code>)：
              </h4>
              <pre className="sdk-raw-code-box">{cbetaRecord.rawXmlExcerpt}</pre>
            </div>
          )}

          {(gretilRecord || entry.sourceMeta.rawExcerpt) && (
            <div className="sdk-source-block">
              <h4 className="sdk-source-block-title">
                <FileCode size={15} />
                本地存档哥廷根大学 GRETIL 梵本原文快照 (
                <code>data/raw/gretil/{gretilRecord?.file || entry.sourceMeta.gretilId}</code>)：
              </h4>
              <pre className="sdk-raw-code-box">
                {gretilRecord?.fullPreview || entry.sourceMeta.rawExcerpt}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
