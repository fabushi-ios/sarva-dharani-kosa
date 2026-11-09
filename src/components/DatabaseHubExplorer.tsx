import React, { useState, useMemo } from 'react';
import type { DatabaseId } from '../types/corpus';
import {
  CANONICAL_DATABASE_IDS,
  UNIFIED_12_DATABASES,
  inspectDatabaseRecords,
  verifyAllDatabasesIntegrity,
} from '../data/unifiedCorpusRegistry';
import { searchAllDatabases } from '../core/searchEngine';

export function DatabaseHubExplorer() {
  const [selectedTier, setSelectedTier] = useState<'all' | 1 | 2 | 3>('all');
  const [selectedDbId, setSelectedDbId] = useState<DatabaseId>('db1_fangshan');
  const [recordQuery, setRecordQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('Avalokiteśvara');
  const [searchDbFilter, setSearchDbFilter] = useState<string>('');

  const filteredDatabases = useMemo(() => {
    if (selectedTier === 'all') return UNIFIED_12_DATABASES;
    return UNIFIED_12_DATABASES.filter((db) => db.priorityTier === selectedTier);
  }, [selectedTier]);

  const selectedDbSummary = useMemo(
    () => UNIFIED_12_DATABASES.find((d) => d.id === selectedDbId) || UNIFIED_12_DATABASES[0],
    [selectedDbId]
  );

  const inspectedPayload = useMemo(
    () => inspectDatabaseRecords(selectedDbId, recordQuery.trim() || undefined),
    [selectedDbId, recordQuery]
  );

  const searchHits = useMemo(
    () =>
      searchAllDatabases(searchQuery, {
        dbId: searchDbFilter ? (searchDbFilter as DatabaseId) : undefined,
        limit: 24,
      }),
    [searchQuery, searchDbFilter]
  );

  const integrityReport = useMemo(() => verifyAllDatabasesIntegrity(), []);

  return (
    <div className="workbench-container">
      <div className="workbench-card">
        <div className="workbench-header-row">
          <div>
            <h2 className="workbench-title">
              十二大國際佛典與梵文陀羅尼數據庫總覽 (12-Database Hub Explorer)
            </h2>
            <p className="workbench-subtitle">
              整合三大優先級 (`Priority Tier 1–3`) 共 {UNIFIED_12_DATABASES.length} 座權威梵藏漢多語語料庫 ·
              全庫完整性驗證狀態: <strong>{integrityReport.status}</strong> ({CANONICAL_DATABASE_IDS.length}/12)
            </p>
          </div>
          <div className="pill-group">
            <button
              type="button"
              className={`pill-btn ${selectedTier === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedTier('all')}
            >
              全部 (12 DBs)
            </button>
            <button
              type="button"
              className={`pill-btn ${selectedTier === 1 ? 'active' : ''}`}
              onClick={() => setSelectedTier(1)}
            >
              第一級 Tier 1 (#1–#6)
            </button>
            <button
              type="button"
              className={`pill-btn ${selectedTier === 2 ? 'active' : ''}`}
              onClick={() => setSelectedTier(2)}
            >
              第二級 Tier 2 (#7–#9)
            </button>
            <button
              type="button"
              className={`pill-btn ${selectedTier === 3 ? 'active' : ''}`}
              onClick={() => setSelectedTier(3)}
            >
              第三級 Tier 3 (#10–#12)
            </button>
          </div>
        </div>

        <div className="db-grid">
          {filteredDatabases.map((db) => {
            const isSelected = db.id === selectedDbId;
            return (
              <div
                key={db.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedDbId(db.id);
                  setRecordQuery('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedDbId(db.id);
                    setRecordQuery('');
                  }
                }}
                className={`db-card ${isSelected ? 'selected' : ''}`}
              >
                <div className="db-card-top">
                  <span className="db-badge">
                    #{db.number} · Tier {db.priorityTier} · {db.id}
                  </span>
                  <span className="db-count">
                    {db.totalRecordsCount.toLocaleString()} 條紀錄
                  </span>
                </div>
                <h3 className="db-card-title">{db.nameZh}</h3>
                <div className="db-card-en">{db.nameEn}</div>
                <div className="db-card-inst">{db.institution}</div>
                <div className="script-tags">
                  {db.scriptsAvailable.map((sc) => (
                    <span key={sc} className="script-tag">
                      {sc}
                    </span>
                  ))}
                </div>
                <ul className="db-highlights">
                  {db.highlights.slice(0, 2).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div className="two-col-grid">
        <div className="workbench-card">
          <h3 className="section-heading">
            跨庫多文字檢索 (Unified Multi-Script 12-Database Search)
          </h3>
          <div className="search-controls">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="輸入梵文 IAST / 天城體 / 悉曇 / 藏文 Wylie / 漢文 / 經號 (如 Avalokiteśvara, Uṣṇīṣavijayā, prajñā, प्रज्ञा, 般若, shes rab)..."
              className="text-input"
            />
            <select
              value={searchDbFilter}
              onChange={(e) => setSearchDbFilter(e.target.value)}
              className="select-input"
            >
              <option value="">全部 12 庫 + 基準庫 (All Databases)</option>
              {UNIFIED_12_DATABASES.map((d) => (
                <option key={d.id} value={d.id}>
                  #{d.number} {d.id} — {d.nameZh}
                </option>
              ))}
            </select>
          </div>
          <div className="preset-chips">
            {[
              'Avalokiteśvara',
              'Uṣṇīṣavijayā',
              'Prajñāpāramitāhṛdaya',
              'prajñā',
              'प्रज्ञा',
              '般若',
              'shes rab',
              'dhāraṇī',
              'svāhā',
              'vajrajāpa',
              'MS-ADD-01326',
              'SA00019.001',
              'M00247',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                className="chip-btn"
                onClick={() => setSearchQuery(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="search-results-list">
            {searchHits.map((hit) => (
              <div key={`${hit.dbId}-${hit.id}`} className="search-hit-item">
                <div className="search-hit-header">
                  <span className="db-badge">{hit.dbId}</span>
                  <strong className="hit-title">{hit.title}</strong>
                </div>
                {hit.subtitle && <div className="hit-subtitle">{hit.subtitle}</div>}
                <div className="hit-snippet">{hit.snippet}</div>
                {hit.siddhamUnicode && (
                  <div className="siddham-script" style={{ fontSize: '1.2rem' }}>
                    {hit.siddhamUnicode}
                  </div>
                )}
                <div className="hit-refs">
                  參照: {hit.canonicalRefs.join(' · ')} |{' '}
                  <a href={hit.sourceUrl} target="_blank" rel="noreferrer">
                    原始出處
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="workbench-card">
          <h3 className="section-heading">
            單庫深度檢視器 (Database Record Inspector): #{selectedDbSummary.number}{' '}
            {selectedDbSummary.id}
          </h3>
          <p className="workbench-subtitle">{selectedDbSummary.nameZh}</p>
          <div className="search-controls">
            <input
              type="text"
              value={recordQuery}
              onChange={(e) => setRecordQuery(e.target.value)}
              placeholder={`篩選 ${selectedDbSummary.id} 內部紀錄 ID (如 F28n1071, MS-ADD-01326, 1175, toh507, K12n2949u)...`}
              className="text-input"
            />
          </div>
          <div className="inspector-highlights">
            {selectedDbSummary.highlights.map((hl, idx) => (
              <div key={idx} className="highlight-bullet">
                • {hl}
              </div>
            ))}
          </div>
          <pre className="json-preview">
            {JSON.stringify(inspectedPayload, null, 2).slice(0, 3200)}
          </pre>
        </div>
      </div>
    </div>
  );
}
export default DatabaseHubExplorer;
