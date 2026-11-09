import React, { useState, useMemo } from 'react';
import { DB7_CUDL_HIDAS_CORPUS } from '../data/unifiedCorpusRegistry';
import { speakSanskrit } from '../services/sanskritAudioEngine';

export function CudlPalmLeafViewer() {
  const [selectedMsId, setSelectedMsId] = useState<string>('MS-ADD-01326');
  const [msFilter, setMsFilter] = useState<string>('');
  const [selectedHidasId, setSelectedHidasId] = useState<string>(
    DB7_CUDL_HIDAS_CORPUS.hidasCriticalEditions[0]?.id || ''
  );

  const filteredManuscripts = useMemo(() => {
    const q = msFilter.trim().toLowerCase();
    if (!q) return DB7_CUDL_HIDAS_CORPUS.manuscripts;
    return DB7_CUDL_HIDAS_CORPUS.manuscripts.filter(
      (m) =>
        m.cudlId.toLowerCase().includes(q) ||
        m.shelfLocator.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.abstractShort.toLowerCase().includes(q)
    );
  }, [msFilter]);

  const selectedMs = useMemo(
    () =>
      DB7_CUDL_HIDAS_CORPUS.manuscripts.find((m) => m.cudlId === selectedMsId) ||
      filteredManuscripts[0] ||
      DB7_CUDL_HIDAS_CORPUS.manuscripts[0],
    [selectedMsId, filteredManuscripts]
  );

  const selectedHidas = useMemo(
    () =>
      DB7_CUDL_HIDAS_CORPUS.hidasCriticalEditions.find((h) => h.id === selectedHidasId) ||
      DB7_CUDL_HIDAS_CORPUS.hidasCriticalEditions[0],
    [selectedHidasId]
  );

  return (
    <div className="workbench-container">
      <div className="workbench-card">
        <h2 className="workbench-title">
          劍橋大學數字圖書館 (`CUDL`) 梵文貝葉經 IIIF 影印與 Hidas 校勘本工作台 (CUDL Palm-Leaf IIIF Viewer)
        </h2>
        <p className="workbench-subtitle">
          收錄劍橋大學 {DB7_CUDL_HIDAS_CORPUS.manuscripts.length} 部梵文陀羅尼貝葉經與紙本寫本 (`MS-ADD-01326` 458 頁《陀羅尼集》、`MS-ADD-01680-00008-00001..3` 12–13 世紀貝葉經、`PR-FG-00870` 770 CE 百萬塔陀羅尼) 及 Gergely Hidas {DB7_CUDL_HIDAS_CORPUS.hidasCriticalEditions.length} 部精校本
        </p>

        <div className="preset-chips">
          {[
            'MS-ADD-01326',
            'MS-ADD-01680-00008-00001',
            'MS-ADD-01680-00008-00002',
            'MS-ADD-01680-00008-00003',
            'PR-FG-00870',
            'MS-ADD-01315',
            'MS-ADD-01325',
          ].map((id) => (
            <button
              key={id}
              type="button"
              className={`chip-btn ${selectedMsId === id ? 'active' : ''}`}
              onClick={() => setSelectedMsId(id)}
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      <div className="two-col-grid">
        <div className="workbench-card">
          <h3 className="section-heading">
            劍橋 CUDL 梵文陀羅尼寫本庫 ({filteredManuscripts.length}/{DB7_CUDL_HIDAS_CORPUS.manuscripts.length})
          </h3>
          <div className="search-controls">
            <input
              type="text"
              value={msFilter}
              onChange={(e) => setMsFilter(e.target.value)}
              placeholder="搜尋劍橋館藏號或經名 (如 MS-ADD-01326, 1680, Saptavāra, Pañcarakṣā)..."
              className="text-input"
            />
          </div>
          <div className="sidebar-list" style={{ maxHeight: 280 }}>
            {filteredManuscripts.map((ms) => (
              <button
                key={ms.cudlId}
                type="button"
                className={`sidebar-item ${ms.cudlId === selectedMs.cudlId ? 'active' : ''}`}
                onClick={() => setSelectedMsId(ms.cudlId)}
              >
                <div className="sidebar-item-title">
                  {ms.cudlId} — {ms.title}
                </div>
                <div className="sidebar-item-sub">
                  {ms.shelfLocator} · {ms.dateDisplay} · {ms.numberOfPages} pages
                </div>
              </button>
            ))}
          </div>

          {selectedMs && (
            <div className="verse-block" style={{ marginTop: '1rem' }}>
              <h4 className="workbench-title">
                {selectedMs.cudlId}: {selectedMs.title}
              </h4>
              <div className="hit-subtitle">
                館藏號: {selectedMs.shelfLocator} · 年代: {selectedMs.dateDisplay} · 材質:{' '}
                {selectedMs.material} · 字體: {selectedMs.script} · 頁數: {selectedMs.numberOfPages} ({selectedMs.extent})
              </div>
              <p className="dharani-summary">{selectedMs.abstractShort}</p>
              <div className="script-summary-box">
                <div>
                  <strong>IIIF Manifest URL: </strong>
                  <a href={selectedMs.iiifManifestUrl} target="_blank" rel="noreferrer">
                    {selectedMs.iiifManifestUrl}
                  </a>
                </div>
                <div>
                  <strong>CUDL TEI-XML URL: </strong>
                  <a href={selectedMs.metadataTeiUrl} target="_blank" rel="noreferrer">
                    {selectedMs.metadataTeiUrl}
                  </a>
                </div>
              </div>
              <h5 className="section-heading">寫本題記與梵文轉寫摘錄 (Diplomatic Rubrics & Excerpts):</h5>
              <ul className="db-highlights">
                {selectedMs.transcribedRubricsAndExcerpts.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="workbench-card">
          <h3 className="section-heading">
            Gergely Hidas 梵文陀羅尼校勘本 ({DB7_CUDL_HIDAS_CORPUS.hidasCriticalEditions.length} 部)
          </h3>
          <div className="search-controls">
            <select
              value={selectedHidasId}
              onChange={(e) => setSelectedHidasId(e.target.value)}
              className="select-input"
            >
              {DB7_CUDL_HIDAS_CORPUS.hidasCriticalEditions.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.titleSanskrit} ({h.id})
                </option>
              ))}
            </select>
          </div>
          {selectedHidas && (
            <div className="verse-block">
              <div className="workbench-header-row">
                <div>
                  <h4 className="workbench-title">{selectedHidas.titleSanskrit}</h4>
                  <div className="hit-subtitle">{selectedHidas.editorCitation}</div>
                </div>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => speakSanskrit(selectedHidas.extractedMantraIast, { mode: 'synth' })}
                >
                  播放梵音合成
                </button>
              </div>
              <div className="hit-subtitle" style={{ marginTop: '0.4rem' }}>
                藏文對勘: {selectedHidas.tibetanParallelRef} · 底本寫本:{' '}
                {selectedHidas.manuscriptWitnesses.join(', ')}
              </div>
              <div className="verse-iast" style={{ marginTop: '0.75rem' }}>
                <strong>精校陀羅尼咒文 (Extracted Mantra IAST):</strong>
                <div style={{ marginTop: '0.35rem' }}>{selectedHidas.extractedMantraIast}</div>
              </div>
              <div className="search-results-list" style={{ marginTop: '0.75rem' }}>
                {selectedHidas.segments.map((seg) => (
                  <div key={seg.segnr} className="search-hit-item">
                    <span className="db-badge">{seg.segnr}</span> <span>{seg.textIast}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default CudlPalmLeafViewer;
