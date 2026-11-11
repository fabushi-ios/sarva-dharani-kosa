import React, { useState, useMemo } from 'react';
import {
  CBETA_AUTH_RECORDS,
  CBETA_GAIJI_MAP,
  DB1_FANGSHAN_CORPUS,
  DB2_TAISHO_EXT_CORPUS,
  GRETIL_AUTH_RECORDS,
  TAISHO_MIKKYO_INDEX,
} from '../data/unifiedCorpusRegistry';
import { sanskritAudioEngine, speakSanskrit } from '../services/sanskritAudioEngine';
import { iastToSiddham } from '../core/sanskrit/transliterator';
import { resolveMixedIastStringSegments } from '../core/provenance/fieldProvenance';
import { ProvenanceBadge } from './common/ProvenanceBadge';

export function FangshanTaishoInterlinearStudio() {
  const [subMode, setSubMode] = useState<'fangshan' | 't54' | 'cbeta_tt' | 'taisho_gretil'>('fangshan');
  const [workFilter, setWorkFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    DB1_FANGSHAN_CORPUS.records[0]?.id || ''
  );
  const [taishoVolFilter, setTaishoVolFilter] = useState<string>('ALL');
  const [taishoQuery, setTaishoQuery] = useState<string>('');
  const [selectedGretilId, setSelectedGretilId] = useState<string>(
    GRETIL_AUTH_RECORDS[0]?.id || ''
  );

  const stats = DB1_FANGSHAN_CORPUS.f28n1071Stats;

  const workIds = useMemo(() => {
    const s = new Set<string>(DB1_FANGSHAN_CORPUS.records.map((r) => r.workId));
    return ['ALL', ...Array.from(s)];
  }, []);

  const filteredFangshanRecords = useMemo(() => {
    return DB1_FANGSHAN_CORPUS.records
      .filter((r) => {
        if (workFilter !== 'ALL' && r.workId !== workFilter) return false;
        if (!searchFilter.trim()) return true;
        const q = searchFilter.trim().toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.xmlId.toLowerCase().includes(q) ||
          r.dharaniTitle.toLowerCase().includes(q) ||
          r.plainChineseText.toLowerCase().includes(q)
        );
      })
      .slice(0, 80);
  }, [workFilter, searchFilter]);

  const selectedFangshan = useMemo(
    () =>
      DB1_FANGSHAN_CORPUS.records.find((r) => r.id === selectedRecordId) ||
      filteredFangshanRecords[0] ||
      DB1_FANGSHAN_CORPUS.records[0],
    [selectedRecordId, filteredFangshanRecords]
  );

  const filteredTaishoMikkyo = useMemo(() => {
    return TAISHO_MIKKYO_INDEX.filter((item) => {
      if (taishoVolFilter !== 'ALL' && item.vol !== taishoVolFilter) return false;
      if (!taishoQuery.trim()) return true;
      const q = taishoQuery.trim().toLowerCase();
      return (
        item.xmlId.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.byline.toLowerCase().includes(q)
      );
    }).slice(0, 80);
  }, [taishoVolFilter, taishoQuery]);

  const selectedGretil = useMemo(
    () =>
      GRETIL_AUTH_RECORDS.find((g) => g.id === selectedGretilId) ||
      GRETIL_AUTH_RECORDS[0],
    [selectedGretilId]
  );

  return (
    <div className="workbench-container">
      <div className="workbench-card">
        <div className="workbench-header-row">
          <div>
            <h2 className="workbench-title">
              房山石經 (F28n1071) 與大正藏 (T54 / T18–T21) 悉曇梵漢對音工作台
            </h2>
            <p className="workbench-subtitle">
              《釋教最上乘秘密藏陀羅尼集》({stats.totalRolls} 卷 · {stats.totalDharaniBlocks} 首陀羅尼 ·{' '}
              {stats.totalTtBlocks.toLocaleString()} 組 <code>&lt;cb:tt&gt;</code> ·{' '}
              {stats.totalSdGlyphs.toLocaleString()} 個悉曇外字 · 夾注:{' '}
              <strong>二合</strong> {stats.erHeCount.toLocaleString()} /{' '}
              <strong>三合</strong> {stats.sanHeCount.toLocaleString()} /{' '}
              <strong>引</strong> {stats.yinCount.toLocaleString()} /{' '}
              <strong>彈舌</strong> {stats.tanSheCount})
            </p>
          </div>
          <div className="pill-group">
            <button
              type="button"
              className={`pill-btn ${subMode === 'fangshan' ? 'active' : ''}`}
              onClick={() => setSubMode('fangshan')}
            >
              DB #1 房山石經 (F28n1071 / F24 / F27)
            </button>
            <button
              type="button"
              className={`pill-btn ${subMode === 't54' ? 'active' : ''}`}
              onClick={() => setSubMode('t54')}
            >
              DB #2 大正藏 T54 梵漢辭書 ({DB2_TAISHO_EXT_CORPUS.lexiconEntries.length})
            </button>
            <button
              type="button"
              className={`pill-btn ${subMode === 'cbeta_tt' ? 'active' : ''}`}
              onClick={() => setSubMode('cbeta_tt')}
            >
              基準唐代密教梵漢對音 ({CBETA_AUTH_RECORDS.length} 部)
            </button>
            <button
              type="button"
              className={`pill-btn ${subMode === 'taisho_gretil' ? 'active' : ''}`}
              onClick={() => setSubMode('taisho_gretil')}
            >
              大正藏密教部 ({TAISHO_MIKKYO_INDEX.length} 部) & GRETIL ({GRETIL_AUTH_RECORDS.length} 部)
            </button>
          </div>
        </div>
      </div>

      {subMode === 'fangshan' && (
        <div className="two-col-grid">
          <aside className="workbench-card">
            <h3 className="section-heading">房山石經陀羅尼檢索 ({filteredFangshanRecords.length})</h3>
            <div className="search-controls">
              <select
                value={workFilter}
                onChange={(e) => setWorkFilter(e.target.value)}
                className="select-input"
              >
                {workIds.map((wid) => (
                  <option key={wid} value={wid}>
                    {wid === 'ALL' ? '全部房山石經經號 (All Works)' : wid}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="搜尋咒名或段落 ID (如 金色寶光妙行成就如來, pF28p0038a0301)..."
                className="text-input"
              />
            </div>
            <div className="sidebar-list">
              {filteredFangshanRecords.map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  className={`sidebar-item ${rec.id === selectedFangshan?.id ? 'active' : ''}`}
                  onClick={() => setSelectedRecordId(rec.id)}
                >
                  <div className="sidebar-item-title">{rec.dharaniTitle}</div>
                  <div className="sidebar-item-sub">
                    {rec.workId} 卷{rec.juan} · {rec.xmlId} ({rec.tokens.length} tokens)
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="workbench-card">
            {selectedFangshan && (
              <>
                <div className="workbench-header-row">
                  <div>
                    <h3 className="workbench-title">{selectedFangshan.dharaniTitle}</h3>
                    <div className="workbench-subtitle">
                      {selectedFangshan.workId} 《{selectedFangshan.workTitle}》 卷{selectedFangshan.juan} ·{' '}
                      {selectedFangshan.compilerOrTranslator} · XML ID: <code>{selectedFangshan.xmlId}</code>
                    </div>
                  </div>
                  {selectedFangshan.reconstructedIast && (
                    <div className="pill-group">
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() =>
                          void sanskritAudioEngine.speakText(selectedFangshan.reconstructedIast || '')
                        }
                      >
                        🔊 48kHz 神經模型吟誦
                      </button>
                      <button
                        type="button"
                        className="pill-btn"
                        onClick={() =>
                          speakSanskrit(selectedFangshan.reconstructedIast || '', { mode: 'synth' })
                        }
                      >
                        播放擬音合成 (136.1 Hz)
                      </button>
                    </div>
                  )}
                </div>

                <div className="script-summary-box">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <strong>漢文音譯全文：</strong>
                      <ProvenanceBadge
                        state="db-original"
                        compact
                        customLabel="● 庫藏原文"
                        customTooltip="【庫藏原文】直接取自房山石經 F28 原典漢文音譯與夾注。"
                      />
                    </div>
                    <div>{selectedFangshan.plainChineseText}</div>
                  </div>
                  {selectedFangshan.reconstructedIast && (() => {
                    const origins = selectedFangshan.clauseOrigins || [];
                    const isFullTt =
                      origins.length > 0
                        ? origins.every((o) => o === 'db-original')
                        : selectedFangshan.ttCount > 0 &&
                          selectedFangshan.ttCount >=
                            Math.max(1, selectedFangshan.plainChineseText.replace(/[\s｜|]/g, '').length * 0.85);
                    const fangshanIastState =
                      selectedFangshan.ttCount === 0
                        ? 'derived-reference'
                        : isFullTt
                        ? 'db-original'
                        : 'mixed';
                    const cbTtIastTokens =
                      fangshanIastState === 'mixed'
                        ? selectedFangshan.tokens
                            .filter((t) => t.tokenType === 'cb_tt' && Boolean(t.iast))
                            .map((t) => t.iast!)
                        : [];
                    const mixedSegs =
                      fangshanIastState === 'mixed'
                        ? resolveMixedIastStringSegments(
                            selectedFangshan.reconstructedIast,
                            cbTtIastTokens
                          )
                        : null;
                    return (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.2rem',
                          marginTop: '0.55rem',
                          paddingTop: '0.55rem',
                          borderTop: '1px dashed var(--border-subtle)',
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <strong>梵文轉寫 (IAST)：</strong>
                          <ProvenanceBadge
                            state={fangshanIastState}
                            compact
                            customLabel={
                              fangshanIastState === 'db-original'
                                ? '● <cb:tt> 梵漢對音原載'
                                : fangshanIastState === 'mixed'
                                ? `◐ 原載(${selectedFangshan.ttCount}組<cb:tt>)+重構參考`
                                : '◇ 對音重構·參考'
                            }
                            customTooltip={
                              fangshanIastState === 'db-original'
                                ? '【庫藏原文】全段音節均由房山石經原刻 <cb:tt> #SD-* 悉曇字碼直接連綴而成。'
                                : fangshanIastState === 'mixed'
                                ? `【原載+參考】朱砂紅字為本段石經原刻之 ${selectedFangshan.ttCount} 組 <cb:tt> 悉曇對音音節，青金藍字為依遼金對音規則與平行梵本重構補全之參考音節。`
                                : '【處理參考】原段無 <cb:tt> 悉曇字碼，此梵文由系統依遼金對音規則重構還原，僅供參考。'
                            }
                          />
                        </div>
                        <div style={{ fontFamily: 'var(--font-iast)', lineHeight: 1.65 }}>
                          {mixedSegs
                            ? mixedSegs.map((seg, idx) => (
                                <span
                                  key={idx}
                                  className={
                                    seg.origin === 'db-original'
                                      ? 'prov-seg-orig'
                                      : 'prov-seg-ref'
                                  }
                                  title={
                                    seg.origin === 'db-original'
                                      ? '● 石經 <cb:tt> 原刻對音音節'
                                      : '◇ 系統重構補全音節（參考）'
                                  }
                                >
                                  {seg.text}
                                </span>
                              ))
                            : selectedFangshan.reconstructedIast}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {(() => {
                  const cbTtTokens = selectedFangshan.tokens.filter(
                    (t) => t.tokenType === 'cb_tt' || Boolean(t.siddhamRef)
                  );
                  return (
                    <>
                      <h4 className="section-heading">
                        逐字 <code>&lt;cb:tt&gt;</code> 悉曇梵漢對音卡片 ({cbTtTokens.length} 組)
                      </h4>
                      {cbTtTokens.length === 0 ? (
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          本段石經原典僅刻漢文音譯與聲韻夾注（無內嵌 <code>&lt;cb:tt&gt;</code> 悉曇外字）。
                        </p>
                      ) : (
                        <div className="syllable-grid">
                          {cbTtTokens.map((tok, tokIdx) => {
                            const gaijiKey = tok.siddhamRef?.replace(/^#/, '') || '';
                            const gaiji = gaijiKey ? CBETA_GAIJI_MAP[gaijiKey] : undefined;
                            const resolvedIast = tok.iast || gaiji?.iast || '';
                            const rawSid = tok.siddhamUnicode || gaiji?.siddhamUnicode || '';
                            const hasSiddhamGlyph = /[\u{11580}-\u{115FF}]/u.test(rawSid);
                            return (
                              <div
                                key={tokIdx}
                                className="syllable-card"
                                style={
                                  hasSiddhamGlyph
                                    ? { borderLeft: '3px solid var(--accent-vermilion)' }
                                    : { borderStyle: 'dashed' }
                                }
                              >
                                <div className="siddham-script">
                                  {(hasSiddhamGlyph ? rawSid : resolvedIast ? iastToSiddham(resolvedIast) : '') || '𑖀'}
                                </div>
                                {!hasSiddhamGlyph && (
                                  <ProvenanceBadge
                                    state="derived-reference"
                                    compact
                                    customLabel="◇ 字形參考"
                                  />
                                )}
                                <div className="syl-iast">
                                  {resolvedIast || tok.siddhamRef || `#${tokIdx + 1}`}
                                </div>
                                <div className="syl-phonetics">{tok.textZh}</div>
                                {tok.phoneticTags && tok.phoneticTags.length > 0 && (
                                  <div className="syl-sandhi">
                                    夾注: {tok.phoneticTags.join(' · ')}
                                  </div>
                                )}
                                {tok.siddhamRef && (
                                  <div className="syl-meter">{tok.siddhamRef}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </main>
        </div>
      )}

      {subMode === 't54' && (
        <div className="workbench-card">
          <h3 className="section-heading">
            大正藏第 54 冊 (T54n2128–2136) 梵漢對音辭書與反切音義
          </h3>
          <div className="search-results-list">
            {DB2_TAISHO_EXT_CORPUS.lexiconEntries.slice(0, 40).map((entry) => (
              <div key={entry.id} className="search-hit-item">
                <div className="search-hit-header">
                  <span className="db-badge">{entry.workId}</span>
                  <strong className="hit-title">
                    《{entry.workTitle}》 — 漢義: {entry.headwordZh} / 音譯: {entry.phoneticZh}
                  </strong>
                  <button
                    type="button"
                    className="chip-btn"
                    onClick={() => void sanskritAudioEngine.speakText(entry.iast)}
                  >
                    🔊 48kHz 發音
                  </button>
                </div>
                <div className="siddham-script" style={{ fontSize: '1.35rem' }}>
                  {/[\u{11580}-\u{115FF}]/u.test(entry.siddhamUnicode)
                    ? entry.siddhamUnicode
                    : iastToSiddham(entry.iast)}
                </div>
                <div className="hit-snippet">
                  IAST: <strong>{entry.iast}</strong> ({entry.devanagari}) · 撰者: {entry.author} ·{' '}
                  {entry.fanqieOrCommentary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subMode === 'cbeta_tt' && (
        <div className="workbench-card">
          <h3 className="section-heading">
            基準唐代密教經軌 (T18–T21) <code>&lt;cb:tt&gt;</code> 梵漢對音 ({CBETA_AUTH_RECORDS.length} 部)
          </h3>
          <div className="search-results-list">
            {CBETA_AUTH_RECORDS.map((rec) => (
              <div key={rec.taishoId} className="search-hit-item">
                <div className="search-hit-header">
                  <span className="db-badge">{rec.taishoId}</span>
                  <strong className="hit-title">{rec.title}</strong>
                  {rec.dharaniBlocks[0] && (
                    <button
                      type="button"
                      className="chip-btn"
                      onClick={() =>
                        void sanskritAudioEngine.speakText(rec.dharaniBlocks[0].iastReconstruction)
                      }
                    >
                      🔊 48kHz 吟誦
                    </button>
                  )}
                </div>
                <div className="hit-subtitle">
                  {rec.translator} · 共 {rec.ttAlignmentsCount} 組 <code>&lt;cb:tt&gt;</code> 對音
                </div>
                {rec.dharaniBlocks[0] && (
                  <div className="hit-snippet">
                    <div className="siddham-script">
                      {iastToSiddham(rec.dharaniBlocks[0].iastReconstruction) ||
                        rec.dharaniBlocks[0].siddhamUnicodeText}
                    </div>
                    <div>IAST: {rec.dharaniBlocks[0].iastReconstruction}</div>
                    <div>漢音: {rec.dharaniBlocks[0].chineseText}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {subMode === 'taisho_gretil' && (
        <div className="two-col-grid">
          <div className="workbench-card">
            <h3 className="section-heading">
              大正新脩大藏經・密教部 (T18–T21 共 {TAISHO_MIKKYO_INDEX.length} 部經軌總目)
            </h3>
            <div className="search-controls">
              <select
                value={taishoVolFilter}
                onChange={(e) => setTaishoVolFilter(e.target.value)}
                className="select-input"
              >
                <option value="ALL">全部冊別 (T18–T21)</option>
                <option value="T18">T18 密教部一</option>
                <option value="T19">T19 密教部二</option>
                <option value="T20">T20 密教部三</option>
                <option value="T21">T21 密教部四</option>
              </select>
              <input
                type="text"
                value={taishoQuery}
                onChange={(e) => setTaishoQuery(e.target.value)}
                placeholder="搜尋經號、經名或譯者 (如 不空, T19n0944A, 大日經)..."
                className="text-input"
              />
            </div>
            <div className="search-results-list">
              {filteredTaishoMikkyo.map((work) => (
                <div key={work.xmlId} className="search-hit-item">
                  <div className="search-hit-header">
                    <span className="db-badge">{work.xmlId}</span>
                    <strong className="hit-title">{work.title}</strong>
                    {work.hasSiddhamTt && <span className="script-tag">含悉曇對音</span>}
                  </div>
                  <div className="hit-subtitle">
                    {work.byline} · {work.juans} 卷 · {work.categoryLabel}
                  </div>
                  <div className="hit-refs">
                    <a href={work.rawXmlUrl} target="_blank" rel="noreferrer">
                      CBETA TEI-P5 原文 XML ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="workbench-card">
            <h3 className="section-heading">
              GRETIL 哥廷根大學梵文佛教陀羅尼與密續底本 ({GRETIL_AUTH_RECORDS.length} 部)
            </h3>
            <div className="search-controls">
              <select
                value={selectedGretilId}
                onChange={(e) => setSelectedGretilId(e.target.value)}
                className="select-input"
              >
                {GRETIL_AUTH_RECORDS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.titleZh} — {g.titleSanskrit} ({g.filename})
                  </option>
                ))}
              </select>
            </div>
            {selectedGretil && (
              <div>
                <div className="workbench-header-row" style={{ marginTop: '0.5rem' }}>
                  <div>
                    <strong style={{ color: 'var(--accent-gold)' }}>{selectedGretil.titleSanskrit}</strong>
                    <div className="hit-subtitle">
                      {selectedGretil.titleZh} · 校勘者: {selectedGretil.editor}
                    </div>
                  </div>
                  {selectedGretil.extractedMantras[0] && (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() =>
                        void sanskritAudioEngine.speakText(selectedGretil.extractedMantras[0])
                      }
                    >
                      🔊 48kHz 吟誦摘錄真言
                    </button>
                  )}
                </div>
                <pre className="json-preview">{selectedGretil.fullTextExcerpt}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default FangshanTaishoInterlinearStudio;
