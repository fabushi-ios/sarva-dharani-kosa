import React, { useState, useMemo } from 'react';
import {
  CONCORDANCE_CLUSTERS,
  getUnifiedMultilingualGlossary,
  resolveCanonicalConcordance,
} from '../core/concordanceEngine';
import {
  DB4_84000_CORPUS,
  DB8_POLYGLOTTA_CORPUS,
  DB9_RKTS_CORPUS,
} from '../data/unifiedCorpusRegistry';

export function ConcordanceParallelStudio() {
  const [concordanceQuery, setConcordanceQuery] = useState<string>('Prajñāpāramitāhṛdaya');
  const [selectedPolyVid, setSelectedPolyVid] = useState<number>(1175);
  const [glossaryQuery, setGlossaryQuery] = useState<string>('dhāraṇī');

  const concordanceResult = useMemo(
    () => resolveCanonicalConcordance(concordanceQuery),
    [concordanceQuery]
  );

  const selectedPolyVolume = useMemo(
    () =>
      DB8_POLYGLOTTA_CORPUS.volumes.find((v) => v.vid === selectedPolyVid) ||
      DB8_POLYGLOTTA_CORPUS.volumes[0],
    [selectedPolyVid]
  );

  const glossaryHits = useMemo(
    () => getUnifiedMultilingualGlossary(glossaryQuery).slice(0, 30),
    [glossaryQuery]
  );

  return (
    <div className="workbench-container">
      <div className="workbench-card">
        <h2 className="workbench-title">
          跨藏經同源對勘與多本平行對齊工作台
        </h2>
        <p className="workbench-subtitle">
          串聯大正藏 (T)、房山石經 (F)、84000 (Toh)、維也納 rKTs (D/K 共{' '}
          {DB9_RKTS_CORPUS.concordanceStats.totalStandardWorks.toLocaleString()} 部)、奧斯陸 Bibliotheca
          Polyglotta (vid=1175 16 本《心經》對勘)、劍橋貝葉經 (MS-ADD-*) 與尼泊爾寫本
        </p>

        <div className="search-controls">
          <input
            type="text"
            value={concordanceQuery}
            onChange={(e) => setConcordanceQuery(e.target.value)}
            placeholder="輸入經號或梵漢藏經名 (如 Prajñāpāramitāhṛdaya, T0251, Toh 507, toh883, Uṣṇīṣavijayā, Vasudhārā, MS-ADD-01326, vid=1175)..."
            className="text-input"
          />
        </div>

        <div className="preset-chips">
          {CONCORDANCE_CLUSTERS.map((c) => (
            <button
              key={c.clusterId}
              type="button"
              className="chip-btn"
              onClick={() => setConcordanceQuery(c.canonicalTitleSanskrit.split(' ')[0])}
            >
              {c.canonicalTitleZh.split(' ')[0]}
            </button>
          ))}
        </div>

        {concordanceResult.primaryCluster ? (
          <div className="concordance-detail">
            <h3 className="section-heading">
              {concordanceResult.primaryCluster.canonicalTitleZh} —{' '}
              {concordanceResult.primaryCluster.canonicalTitleSanskrit}
            </h3>
            <div className="workbench-subtitle">
              藏文: {concordanceResult.primaryCluster.canonicalTitleTibetan} · English:{' '}
              {concordanceResult.primaryCluster.canonicalTitleEn}
            </div>
            <div className="script-tags" style={{ marginTop: '0.5rem' }}>
              {concordanceResult.primaryCluster.databasesPresent.map((dbId) => (
                <span key={dbId} className="db-badge">
                  {dbId}
                </span>
              ))}
            </div>
            <div className="search-results-list" style={{ marginTop: '0.85rem' }}>
              {concordanceResult.primaryCluster.witnessSummary.map((w, idx) => (
                <div key={idx} className="search-hit-item">
                  <div className="search-hit-header">
                    <span className="db-badge">{w.dbId}</span>
                    <strong className="hit-title">
                      [{w.recordId}] {w.label}
                    </strong>
                  </div>
                  <div className="hit-snippet">{w.sampleMantraOrIncipit}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="hit-subtitle">查無對應同源經群: {concordanceResult.message}</div>
        )}
      </div>

      <div className="two-col-grid">
        <div className="workbench-card">
          <h3 className="section-heading">
            奧斯陸大學 Bibliotheca Polyglotta 逐句平行對勘 (`DB8_POLYGLOTTA_CORPUS`)
          </h3>
          <div className="search-controls">
            <select
              value={selectedPolyVid}
              onChange={(e) => setSelectedPolyVid(Number(e.target.value))}
              className="select-input"
            >
              {DB8_POLYGLOTTA_CORPUS.volumes.map((v) => (
                <option key={`${v.vid}-${v.cid || 0}`} value={v.vid}>
                  vid={v.vid}
                  {v.cid ? `&cid=${v.cid}` : ''} — {v.titleZh} ({v.titleSanskrit})
                </option>
              ))}
            </select>
          </div>
          {selectedPolyVolume && (
            <div>
              <div className="hit-subtitle" style={{ marginBottom: '0.6rem' }}>
                對勘版本 (Witnesses): {selectedPolyVolume.witnesses.join(' · ')}
              </div>
              {selectedPolyVolume.alignedRows.map((row) => (
                <div key={row.rowIndex} className="verse-block">
                  <div className="verse-header">
                    <strong>段落 {row.sectionRef}</strong>
                  </div>
                  {row.cells.map((cell, cIdx) => (
                    <div key={cIdx} style={{ marginTop: '0.3rem', fontSize: '0.9rem' }}>
                      <span className="script-tag">{cell.witnessLabel}</span>{' '}
                      <span>{cell.text}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="workbench-card">
          <h3 className="section-heading">
            梵藏漢英四語密教詞典 (`84000` + 《翻譯名義大集》§25/§198 + `T54`)
          </h3>
          <p className="workbench-subtitle">
            整合 84000 ({DB4_84000_CORPUS.glossary.length} 條) 與《翻譯名義大集》密教品 ({DB8_POLYGLOTTA_CORPUS.mahavyutpattiEsotericGlossary.length} 條)
          </p>
          <div className="search-controls">
            <input
              type="text"
              value={glossaryQuery}
              onChange={(e) => setGlossaryQuery(e.target.value)}
              placeholder="搜尋詞條 (如 dhāraṇī, prajñā, adhiṣṭhāna, vidyārājñī, ucchuṣma)..."
              className="text-input"
            />
          </div>
          <div className="preset-chips">
            {['dhāraṇī', 'prajñā', 'adhiṣṭhāna', 'vidyārājñī', 'ucchuṣma', 'amṛtakuṇḍalī', 'hayagrīva'].map(
              (term) => (
                <button
                  key={term}
                  type="button"
                  className="chip-btn"
                  onClick={() => setGlossaryQuery(term)}
                >
                  {term}
                </button>
              )
            )}
          </div>
          <div className="search-results-list">
            {glossaryHits.map((g) => (
              <div key={g.id} className="search-hit-item">
                <div className="search-hit-header">
                  <span className="db-badge">{g.sourceDb}</span>
                  <strong className="hit-title">{g.sanskritIast}</strong>
                </div>
                <div className="hit-snippet">
                  {g.tibetanWylie && <div>藏文 (Wylie): {g.tibetanWylie} {g.tibetanUnicode || ''}</div>}
                  {g.chinese && <div>漢文: {g.chinese}</div>}
                  <div>English: {g.english}</div>
                  {g.definition && <div className="hit-subtitle">{g.definition}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default ConcordanceParallelStudio;
