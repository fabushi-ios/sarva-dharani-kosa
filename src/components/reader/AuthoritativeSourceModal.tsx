import React from 'react';
import type { DharaniItem } from '../../types/dharani';
import { CBETA_AUTH_RECORDS } from '../../data/generated/cbetaAuthRecords';
import { GRETIL_AUTH_RECORDS } from '../../data/generated/gretilAuthRecords';

interface AuthoritativeSourceModalProps {
  entry: DharaniItem;
  onClose: () => void;
}

export const AuthoritativeSourceModal: React.FC<AuthoritativeSourceModalProps> = ({
  entry,
  onClose
}) => {
  const { authoritativeSource: sourceMeta } = entry;
  const cbetaId = entry.cbetaInterlinearXmlId || sourceMeta.cbetaXmlId;
  const cbetaRecord = CBETA_AUTH_RECORDS.find(
    (r) => r.xmlId === cbetaId || r.taishoNo === cbetaId
  );
  const gretilRecord = sourceMeta.gretilId
    ? GRETIL_AUTH_RECORDS.find(
        (g) => g.filename === sourceMeta.gretilId || g.id === entry.gretilRecordId
      )
    : undefined;

  const crossRefEntries = Object.entries(sourceMeta.crossRefs || {}).filter(
    ([, val]) => (Array.isArray(val) && val.length > 0) || (typeof val === 'string' && val.length > 0)
  );

  return (
    <div className="sdk-modal-backdrop" onClick={onClose}>
      <div className="sdk-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sdk-modal-header">
          <div>
            <h2 className="sdk-modal-title">
              🏛️ 权威学术原典溯源与全球12大数据库对勘凭证 · {entry.titleZh}
            </h2>
            <p className="sdk-modal-subtitle">
              {entry.titleSanskrit} ({sourceMeta.cbetaXmlId} ·{' '}
              {sourceMeta.taishoLocation || entry.taishoId})
            </p>
          </div>
          <button type="button" className="sdk-modal-close" onClick={onClose}>
            ✕ 关闭
          </button>
        </div>

        <div className="sdk-modal-body">
          {/* 1. 汉传大藏经 CBETA XML-P5 溯源 */}
          <div className="sdk-source-block">
            <h3 className="sdk-source-heading">
              1. 汉传《大正新修大藏经》CBETA TEI-P5 原典出处
            </h3>
            <div className="sdk-source-grid">
              <div>
                <strong>大正藏经号：</strong>
                <span>{sourceMeta.cbetaXmlId}</span>
              </div>
              <div>
                <strong>册页定位：</strong>
                <span>{sourceMeta.taishoLocation || entry.taishoId}</span>
              </div>
              <div>
                <strong>历代译者：</strong>
                <span>
                  {entry.translator} ({entry.period})
                </span>
              </div>
              <div>
                <strong>CBETA 原始 XML：</strong>
                <a
                  href={sourceMeta.cbetaRawUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sdk-ext-link"
                >
                  {sourceMeta.cbetaRawUrl} ↗
                </a>
              </div>
            </div>

            {cbetaRecord && (
              <div className="sdk-raw-excerpt-wrap">
                <div className="sdk-raw-excerpt-title">
                  CBETA XML-P5 原始切片预览（提取自 <code>{cbetaRecord.xmlId}.xml</code>，含{' '}
                  {cbetaRecord.dharaniBlocksCount} 段陀罗尼、{cbetaRecord.ttAlignmentsCount}{' '}
                  组悉昙对音）：
                </div>
                <pre className="sdk-raw-code-box">
                  {cbetaRecord.rawXmlExcerpt || sourceMeta.rawExcerpt}
                </pre>
              </div>
            )}
          </div>

          {/* 2. 梵文贝叶经写本与哥廷根大学 GRETIL 校勘本溯源 */}
          <div className="sdk-source-block">
            <h3 className="sdk-source-heading">
              2. 梵文贝叶经底本与国际梵学数据库 (Göttingen GRETIL / DSBC)
            </h3>
            <div className="sdk-source-grid">
              <div>
                <strong>梵文校勘本引证：</strong>
                <span>{sourceMeta.sanskritEditionCitation}</span>
              </div>
              {sourceMeta.gretilId && (
                <div>
                  <strong>GRETIL 档案编号：</strong>
                  <span>{sourceMeta.gretilId}</span>
                </div>
              )}
              {sourceMeta.gretilRawUrl && (
                <div>
                  <strong>GRETIL 原始梵本链接：</strong>
                  <a
                    href={sourceMeta.gretilRawUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sdk-ext-link"
                  >
                    {sourceMeta.gretilRawUrl} ↗
                  </a>
                </div>
              )}
            </div>

            {gretilRecord ? (
              <div className="sdk-raw-excerpt-wrap">
                <div className="sdk-raw-excerpt-title">
                  哥廷根大学 GRETIL 梵文原典文本预览（文件 <code>{gretilRecord.filename}</code>，共{' '}
                  {gretilRecord.totalLines} 行）：
                </div>
                <pre className="sdk-raw-code-box">{gretilRecord.fullTextExcerpt}</pre>
              </div>
            ) : (
              sourceMeta.rawExcerpt && (
                <div className="sdk-raw-excerpt-wrap">
                  <div className="sdk-raw-excerpt-title">原典核心引文切片：</div>
                  <pre className="sdk-raw-code-box">{sourceMeta.rawExcerpt}</pre>
                </div>
              )
            )}
          </div>

          {/* 3. 全球 12 大权威梵文陀罗尼数据库跨语种同源引证 */}
          {crossRefEntries.length > 0 && (
            <div className="sdk-source-block">
              <h3 className="sdk-source-heading">
                3. 全球 12 大权威梵文陀罗尼数据库跨典籍编号 (Cross-Canonical Concordance)
              </h3>
              <div className="sdk-source-grid">
                {crossRefEntries.map(([key, val]) => (
                  <div key={key}>
                    <strong>{key}：</strong>
                    <span>{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. 唐代悉昙音注与声明学体例 */}
          <div className="sdk-source-block">
            <h3 className="sdk-source-heading">4. 原典夹注与唐代梵音对勘要点</h3>
            <ul className="sdk-source-notes-list">
              {sourceMeta.tangPhoneticNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
