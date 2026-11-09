import React, { useState, useMemo } from 'react';
import {
  CBETA_AUTH_RECORDS,
  CBETA_GAIJI_MAP,
  DB1_FANGSHAN_CORPUS,
  DB2_TAISHO_EXT_CORPUS,
} from '../data/unifiedCorpusRegistry';
import { speakSanskrit } from '../services/sanskritAudioEngine';

export function FangshanTaishoInterlinearStudio() {
  const [subMode, setSubMode] = useState<'fangshan' | 't54' | 'cbeta_tt'>('fangshan');
  const [workFilter, setWorkFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(
    DB1_FANGSHAN_CORPUS.records[0]?.id || ''
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

  return (
    <div className="workbench-container">
      <div className="workbench-card">
        <div className="workbench-header-row">
          <div>
            <h2 className="workbench-title">
              房山石經 (`F28n1071`) 與大正藏 (`T54`) 悉曇梵漢對音工作台 (Fangshan & T54 Interlinear Studio)
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
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => speakSanskrit(selectedFangshan.reconstructedIast || '', { mode: 'synth' })}
                    >
                      播放擬音合成
                    </button>
                  )}
                </div>

                <div className="script-summary-box">
                  <div>
                    <strong>漢文音譯全文：</strong> {selectedFangshan.plainChineseText}
                  </div>
                  {selectedFangshan.reconstructedIast && (
                    <div>
                      <strong>梵文轉寫 (Reconstructed IAST)：</strong> {selectedFangshan.reconstructedIast}
                    </div>
                  )}
                </div>

                <h4 className="section-heading">
                  逐字 <code>&lt;cb:tt&gt;</code> 悉曇梵漢對音卡片 ({selectedFangshan.tokens.length} 組)
                </h4>
                <div className="syllable-grid">
                  {selectedFangshan.tokens.map((tok, tokIdx) => {
                    const gaiji = tok.siddhamRef ? CBETA_GAIJI_MAP[tok.siddhamRef] : undefined;
                    return (
                      <div key={tokIdx} className="syllable-card">
                        <div className="siddham-script">
                          {tok.siddhamUnicode || gaiji?.siddhamUnicode || '𑖀'}
                        </div>
                        <div className="syl-iast">
                          {tok.iast || gaiji?.iast || tok.siddhamRef || `#${tokIdx + 1}`}
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
              </>
            )}
          </main>
        </div>
      )}

      {subMode === 't54' && (
        <div className="workbench-card">
          <h3 className="section-heading">
            大正藏第 54 冊 (`T54n2128–2136`) 梵漢對音辭書與反切音義
          </h3>
          <div className="search-results-list">
            {DB2_TAISHO_EXT_CORPUS.lexiconEntries.slice(0, 40).map((entry) => (
              <div key={entry.id} className="search-hit-item">
                <div className="search-hit-header">
                  <span className="db-badge">{entry.workId}</span>
                  <strong className="hit-title">
                    《{entry.workTitle}》 — 漢義: {entry.headwordZh} / 音譯: {entry.phoneticZh}
                  </strong>
                </div>
                <div className="siddham-script" style={{ fontSize: '1.35rem' }}>
                  {entry.siddhamUnicode}
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
            基準唐代密教經軌 (`T18–T21`) <code>&lt;cb:tt&gt;</code> 梵漢對音 ({CBETA_AUTH_RECORDS.length} 部)
          </h3>
          <div className="search-results-list">
            {CBETA_AUTH_RECORDS.map((rec) => (
              <div key={rec.taishoId} className="search-hit-item">
                <div className="search-hit-header">
                  <span className="db-badge">{rec.taishoId}</span>
                  <strong className="hit-title">{rec.title}</strong>
                </div>
                <div className="hit-subtitle">
                  {rec.translator} · 共 {rec.ttAlignmentsCount} 組 <code>&lt;cb:tt&gt;</code> 對音
                </div>
                {rec.dharaniBlocks[0] && (
                  <div className="hit-snippet">
                    <div className="siddham-script">{rec.dharaniBlocks[0].siddhamUnicodeText}</div>
                    <div>IAST: {rec.dharaniBlocks[0].iastReconstruction}</div>
                    <div>漢音: {rec.dharaniBlocks[0].chineseText}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default FangshanTaishoInterlinearStudio;
