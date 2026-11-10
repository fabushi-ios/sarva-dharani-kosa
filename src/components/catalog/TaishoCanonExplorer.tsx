import React, { useState, useMemo } from 'react';
import { TAISHO_MIKKYO_INDEX } from '../../data/generated/taishoMikkyoIndex';
import { CBETA_AUTH_RECORDS } from '../../data/generated/cbetaAuthRecords';
import type { TaishoMikkyoEntry, CbetaTtAlignment } from '../../types/dharani';
import { analyzeSanskritLine } from '../../core/prosody';
import { playSingleSyllable } from '../../services/sanskritAudioEngine';

interface LiveScripturePreview {
  xmlId: string;
  vol: string;
  title: string;
  translator: string;
  xmlUrl: string;
  dharaniParagraphs: string[];
  ttPairs: CbetaTtAlignment[];
  rawXmlPreview: string;
  fetchedFromCache: boolean;
}

export const TaishoCanonExplorer: React.FC = () => {
  const [selectedVol, setSelectedVol] = useState<'ALL' | 'T18' | 'T19' | 'T20' | 'T21'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyPrebundled, setOnlyPrebundled] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TaishoMikkyoEntry>(
    TAISHO_MIKKYO_INDEX.find((e) => e.xmlId === 'T19n0974B') || TAISHO_MIKKYO_INDEX[0]
  );
  const [liveData, setLiveData] = useState<LiveScripturePreview | null>(() => {
    const pre = CBETA_AUTH_RECORDS.find((r) => r.xmlId === 'T19n0974B') || CBETA_AUTH_RECORDS[0];
    if (!pre) return null;
    return {
      xmlId: pre.xmlId,
      vol: pre.vol,
      title: pre.title,
      translator: pre.translator,
      xmlUrl: pre.rawXmlUrl,
      dharaniParagraphs: pre.dharaniTextBlocks,
      ttPairs: pre.ttAlignments,
      rawXmlPreview: pre.rawXmlExcerpt,
      fetchedFromCache: true
    };
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const prebundledIds = useMemo(
    () => new Set(CBETA_AUTH_RECORDS.map((r) => r.xmlId)),
    []
  );

  const filteredList = useMemo(() => {
    return TAISHO_MIKKYO_INDEX.filter((item) => {
      if (selectedVol !== 'ALL' && item.vol !== selectedVol) return false;
      if (onlyPrebundled && !prebundledIds.has(item.xmlId)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          item.xmlId.toLowerCase().includes(q) ||
          item.taishoNo.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.translator.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedVol, onlyPrebundled, searchQuery, prebundledIds]);

  const handleSelectScripture = async (item: TaishoMikkyoEntry) => {
    setSelectedEntry(item);
    setErrorMsg(null);

    const prebuilt = CBETA_AUTH_RECORDS.find(
      (r) => r.xmlId === item.xmlId || r.taishoNo === item.taishoNo
    );
    if (prebuilt) {
      setLiveData({
        xmlId: prebuilt.xmlId,
        vol: prebuilt.vol,
        title: prebuilt.title,
        translator: prebuilt.translator,
        xmlUrl: prebuilt.rawXmlUrl,
        dharaniParagraphs: prebuilt.dharaniTextBlocks,
        ttPairs: prebuilt.ttAlignments,
        rawXmlPreview: prebuilt.rawXmlExcerpt,
        fetchedFromCache: true
      });
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(item.rawXmlUrl);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} — 无法从 CBETA GitHub 拉取 ${item.xmlId}.xml`);
      }
      const xmlText = await resp.text();
      const dharaniParagraphs: string[] = [];
      const pRegex = /<p[^>]*cb:type="dharani"[^>]*>([\s\S]*?)<\/p>/g;
      let m: RegExpExecArray | null;
      while ((m = pRegex.exec(xmlText)) !== null) {
        const cleaned = m[1]
          .replace(/<note[^>]*>([\s\S]*?)<\/note>/g, '（$1）')
          .replace(/<[^>]+>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleaned.length > 2) {
          dharaniParagraphs.push(cleaned);
        }
      }
      const snippet =
        xmlText.match(/<p[^>]*cb:type="dharani"[\s\S]{1,1200}/)?.[0] ||
        xmlText.slice(0, 1200);
      setLiveData({
        xmlId: item.xmlId,
        vol: item.vol,
        title: item.title,
        translator: item.translator,
        xmlUrl: item.rawXmlUrl,
        dharaniParagraphs,
        ttPairs: [],
        rawXmlPreview: snippet.trim(),
        fetchedFromCache: false
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setLiveData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sdk-canon-explorer">
      {/* 顶部说明横幅 */}
      <div className="sdk-canon-banner">
        <div>
          <h2 className="sdk-canon-title">
            🏛️ 《大正新修大藏经》密教部 (T18–T21 · No.0848–No.1420) 全景原典浏览器
          </h2>
          <p className="sdk-canon-desc">
            完整索引 CBETA XML-P5 密教部四册共 <strong>{TAISHO_MIKKYO_INDEX.length}</strong>{' '}
            部原典经轨（含预编译高精悉昙对音经典 <strong>{CBETA_AUTH_RECORDS.length}</strong> 部、
            <strong>916</strong> 组 <code>&lt;cb:tt&gt;</code> 悉昙字码对音）。点击任意经号可直接审阅本地预编译或实时从{' '}
            <code>cbeta-org/xml-p5</code> 拉取原典中的 <code>&lt;p cb:type=&quot;dharani&quot;&gt;</code> 陀罗尼段落。
          </p>
        </div>
      </div>

      <div className="sdk-canon-layout">
        {/* 左侧目录栏 */}
        <aside className="sdk-canon-sidebar">
          <div className="sdk-canon-filters">
            <input
              type="text"
              className="sdk-search-input"
              placeholder="检索经号 (如 T0848 / T1060) 或经名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="sdk-vol-tabs">
              {(['ALL', 'T18', 'T19', 'T20', 'T21'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`sdk-vol-btn ${selectedVol === v ? 'active' : ''}`}
                  onClick={() => setSelectedVol(v)}
                >
                  {v === 'ALL' ? '全部四册' : `${v}册`}
                </button>
              ))}
            </div>

            <label className="sdk-checkbox-row" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.55rem', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={onlyPrebundled}
                onChange={(e) => setOnlyPrebundled(e.target.checked)}
              />
              <span>仅显示含离线预编译悉昙对音的经典 ({CBETA_AUTH_RECORDS.length} 部)</span>
            </label>
          </div>

          <div className="sdk-canon-list">
            {filteredList.map((item) => {
              const isPrebuilt = prebundledIds.has(item.xmlId);
              const isSelected = selectedEntry?.xmlId === item.xmlId;
              return (
                <div
                  key={item.xmlId}
                  className={`sdk-canon-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectScripture(item)}
                >
                  <div className="sdk-canon-item-top">
                    <span className="sdk-canon-id">{item.xmlId}</span>
                    <span className="sdk-canon-vol">{item.vol} · {item.juans}卷</span>
                    {isPrebuilt && (
                      <span className="sdk-prebuilt-badge" style={{ fontSize: '0.68rem', background: '#fdf0ef', color: '#9e2a2b', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #e6b8b8' }}>
                        ⚡ 离线预编译
                      </span>
                    )}
                  </div>
                  <div className="sdk-canon-item-title">{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {item.translator} · {item.categoryLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* 右侧原典详情与实时解析面板 */}
        <section className="sdk-canon-detail">
          {loading && (
            <div className="sdk-loading-panel" style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="sdk-spinner" />
              <p>
                正在从 CBETA GitHub 仓库 (<code>cbeta-org/xml-p5</code>) 拉取并解析{' '}
                <strong>{selectedEntry.xmlId}</strong> 原典 XML...
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="sdk-error-panel" style={{ padding: '1.5rem', background: '#fff5f5', border: '1px solid #e6b8b8', borderRadius: '8px' }}>
              <h3>⚠️ 在线拉取提示</h3>
              <p>{errorMsg}</p>
              <a
                href={selectedEntry.rawXmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sdk-ext-link"
              >
                尝试在浏览器直接访问：{selectedEntry.rawXmlUrl} ↗
              </a>
            </div>
          )}

          {!loading && liveData && (
            <div className="sdk-live-result">
              <div className="sdk-live-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                <div>
                  <div className="sdk-live-badges" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span className="sdk-badge-taisho">
                      {liveData.vol} · {liveData.xmlId}
                    </span>
                    <span className="sdk-badge-tradition">译者：{liveData.translator}</span>
                    <span className="sdk-badge-provenance">
                      {liveData.fetchedFromCache
                        ? '⚡ 本地预编译权威缓存'
                        : '🌐 CBETA GitHub 实时拉取解析'}
                    </span>
                  </div>
                  <h3 className="sdk-live-title" style={{ fontSize: '1.35rem', color: 'var(--accent-cinnabar)', fontFamily: 'var(--font-serif-zh)' }}>
                    {liveData.title}
                  </h3>
                </div>
                <a
                  href={liveData.xmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sdk-link-pill"
                >
                  🔗 查看完整 TEI-P5 XML 源文件 ↗
                </a>
              </div>

              {/* 1. 提取到的 <p cb:type="dharani"> 陀罗尼段落 */}
              <div className="sdk-live-section" style={{ marginBottom: '1.5rem' }}>
                <h4 className="sdk-live-sec-title" style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  📿 原典 <code>&lt;p cb:type=&quot;dharani&quot;&gt;</code> 陀罗尼咒文段落 ({liveData.dharaniParagraphs.length} 段)
                </h4>
                {liveData.dharaniParagraphs.length === 0 ? (
                  <p className="sdk-empty-note" style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    本经以仪轨或悉昙字门解说为主，未单独标记 <code>cb:type=&quot;dharani&quot;</code> 段落，请查看下方悉昙对音或原始 XML 切片。
                  </p>
                ) : (
                  <div className="sdk-dharani-para-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {liveData.dharaniParagraphs.map((p, idx) => (
                      <div key={idx} className="sdk-dharani-para-card" style={{ background: 'var(--bg-parchment)', border: '1px solid var(--border-gold)', borderRadius: '8px', padding: '0.85rem 1rem', lineHeight: 1.75 }}>
                        <span className="sdk-para-num" style={{ fontWeight: 700, color: 'var(--accent-cinnabar)', marginRight: '0.6rem' }}>
                          [咒段 {idx + 1}]
                        </span>
                        <span className="sdk-para-text">{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. 提取到的 <cb:tt> 悉昙梵汉逐字对音 */}
              {liveData.ttPairs.length > 0 && (
                <div className="sdk-live-section" style={{ marginBottom: '1.5rem' }}>
                  <h4 className="sdk-live-sec-title" style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    𑖀 原典 <code>&lt;cb:tt&gt;</code> 悉昙梵汉逐字对音 ({liveData.ttPairs.length} 字 · 点击发声)
                  </h4>
                  <div className="sdk-tt-grid">
                    {liveData.ttPairs.slice(0, 120).map((pair, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="sdk-tt-card"
                        onClick={() => {
                          if (pair.iast) {
                            const syl = analyzeSanskritLine(pair.iast, { mode: 'smart' }).words[0]
                              ?.syllables[0];
                            if (syl) void playSingleSyllable(syl);
                          }
                        }}
                      >
                        <span className="sdk-tt-siddham" lang="sa-Sidd">
                          {pair.siddhamUnicode || '𑖀'}
                        </span>
                        <span className="sdk-tt-iast">{pair.iast || pair.siddhamRef}</span>
                        <span className="sdk-tt-zh">{pair.chineseZi}</span>
                        {pair.yinNotes.length > 0 && (
                          <span className="sdk-tt-yinnote">{pair.yinNotes.join('·')}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. 原始 XML 代码预览 */}
              <div className="sdk-live-section">
                <h4 className="sdk-live-sec-title" style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                  📄 CBETA TEI-P5 原始 XML 结构切片
                </h4>
                <pre className="sdk-raw-code-box">{liveData.rawXmlPreview}</pre>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
