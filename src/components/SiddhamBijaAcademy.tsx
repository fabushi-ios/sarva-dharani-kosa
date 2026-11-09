import React, { useState, useMemo } from 'react';
import {
  decipherBijaSyllable,
  getAllBijaLexiconEntries,
} from '../core/bijaLexiconEngine';
import {
  DB2_TAISHO_EXT_CORPUS,
  DB12_MUKTABODHA_OCHS_CORPUS,
} from '../data/unifiedCorpusRegistry';
import { playSingleSyllable } from '../services/sanskritAudioEngine';

export function SiddhamBijaAcademy() {
  const [bijaInput, setBijaInput] = useState<string>('hūṃ');
  const [selectedChapNum, setSelectedChapNum] = useState<number>(1);

  const allBijaEntries = useMemo(() => getAllBijaLexiconEntries(), []);
  const deciphered = useMemo(() => decipherBijaSyllable(bijaInput), [bijaInput]);

  const selectedChapter = useMemo(
    () =>
      DB2_TAISHO_EXT_CORPUS.siddham18Chapters.find((c) => c.chapterNumber === selectedChapNum) ||
      DB2_TAISHO_EXT_CORPUS.siddham18Chapters[0],
    [selectedChapNum]
  );

  return (
    <div className="workbench-container">
      <div className="workbench-card">
        <div className="workbench-header-row">
          <div>
            <h2 className="workbench-title">
              密續種子字破譯引擎 (`Bīja-Nighaṇṭu` / `Ekākṣarakośa` / 空海 `T84n2701`) 與悉曇十八章學院 (Siddhaṃ 18-Chapter & Bīja Academy)
            </h2>
            <p className="workbench-subtitle">
              聯合檢索空海《梵字悉曇字母并釋義》(`T84n2701`)、牛津 OCHS《Bījanighaṇṭu》(`#30`)、《Ekākṣarakośa》(`#46`) 與 Muktabodha《Uddhārakośa》(`M00247`) · 支援單一或複合種子字序列破譯
            </p>
          </div>
          {deciphered.entry && (
            <button
              type="button"
              className="primary-btn"
              onClick={() => playSingleSyllable(deciphered.entry?.bijaSlp1 || 'oM', { mode: 'synth' })}
            >
              播放種子字 136.1 Hz 共振音 ({deciphered.entry.bijaIast})
            </button>
          )}
        </div>

        <div className="search-controls">
          <input
            type="text"
            value={bijaInput}
            onChange={(e) => setBijaInput(e.target.value)}
            placeholder="輸入單一或複合種子字 (如 oṃ, āḥ, hūṃ, hrīḥ, krīṃ, aiṃ, śrīṃ, bhrūṃ, phaṭ, svāhā 或 oṃ āḥ hūṃ hrīḥ svāhā)..."
            className="text-input"
          />
        </div>

        <div className="preset-chips">
          {allBijaEntries.map((entry) => (
            <button
              key={entry.bijaIast}
              type="button"
              className={`chip-btn ${bijaInput === entry.bijaIast ? 'active' : ''}`}
              onClick={() => setBijaInput(entry.bijaIast)}
            >
              {entry.bijaSiddham} {entry.bijaIast} ({entry.bijaDevanagari})
            </button>
          ))}
          <button
            type="button"
            className="chip-btn"
            onClick={() => setBijaInput('oṃ āḥ hūṃ hrīḥ svāhā')}
          >
            複合五字真言: oṃ āḥ hūṃ hrīḥ svāhā
          </button>
        </div>

        <div className="search-results-list">
          {deciphered.entries.map((e) => (
            <div key={e.bijaIast} className="search-hit-item">
              <div className="search-hit-header">
                <span className="siddham-script" style={{ fontSize: '1.8rem' }}>
                  {e.bijaSiddham}
                </span>
                <strong className="hit-title">
                  {e.bijaIast} ({e.bijaDevanagari} · SLP1: {e.bijaSlp1}) — 唐音: {e.tangChinese}
                </strong>
                <span className="db-badge">
                  詩律: {e.chandasWeight} ({e.meterSymbol})
                </span>
              </div>
              <div className="hit-snippet">
                <div>
                  <strong>音素拆解 (Phonemic Breakdown):</strong> {e.phonemicBreakdown.join(' + ')}
                </div>
                <div>
                  <strong>密續隱語代號 (Uddhāra Code-Names):</strong> {e.uddharaCodeNames.join(', ')}
                </div>
                <div>
                  <strong>佛教密乘字門義 (Buddhist Mikkyō Meaning):</strong> {e.buddhistMeaning}
                </div>
                <div>
                  <strong>印度密續字書義 (Tantric Nighaṇṭu Meaning):</strong> {e.tantricNighantuMeaning}
                </div>
                {e.kukaiT84Note && (
                  <div>
                    <strong>空海《T84n2701》釋義:</strong> {e.kukaiT84Note}
                  </div>
                )}
              </div>
              <div className="hit-refs">
                典籍引證:{' '}
                {e.sourceCitations
                  .map((c) => `[${c.dbId}] ${c.workTitle}: "${c.verbatimQuote}"`)
                  .join(' | ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col-grid">
        <div className="workbench-card">
          <h3 className="section-heading">
            悉曇十八章 (`十八章` / 18 Siddhaṃ Parivartas, 共{' '}
            {DB2_TAISHO_EXT_CORPUS.siddhamRegistryStats.totalChapterCells.toLocaleString()} 字格)
          </h3>
          <div className="search-controls">
            <select
              value={selectedChapNum}
              onChange={(e) => setSelectedChapNum(Number(e.target.value))}
              className="select-input"
            >
              {DB2_TAISHO_EXT_CORPUS.siddham18Chapters.map((c) => (
                <option key={c.chapterNumber} value={c.chapterNumber}>
                  第 {c.chapterNumber} 章: {c.titleZh} ({c.titleEn} · {c.totalCells} 字)
                </option>
              ))}
            </select>
          </div>
          {selectedChapter && (
            <div>
              <p className="dharani-summary">{selectedChapter.description}</p>
              <div className="syllable-grid">
                {selectedChapter.sampleCells.map((cell) => (
                  <div key={cell.cellId} className="syllable-card">
                    <div className="siddham-script">{cell.siddhamUnicode}</div>
                    <div className="syl-iast">{cell.iast}</div>
                    <div className="syl-meter">{cell.cellId}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="workbench-card">
          <h3 className="section-heading">
            大正藏第 84 冊悉曇部 (`T84n2701–2711`) 與 Muktabodha / OCHS 密續字書 (`DB12`)
          </h3>
          <div className="search-results-list">
            {DB2_TAISHO_EXT_CORPUS.siddhamTreatises.slice(0, 6).map((tr) => (
              <div key={tr.taishoId} className="search-hit-item">
                <div className="search-hit-header">
                  <span className="db-badge">
                    {tr.taishoId} ({tr.bkkbooksRepoId})
                  </span>
                  <strong className="hit-title">{tr.title}</strong>
                </div>
                <div className="hit-subtitle">{tr.author}</div>
                <div className="hit-snippet">{tr.excerptText}</div>
              </div>
            ))}
            {DB12_MUKTABODHA_OCHS_CORPUS.ochsLexiconManuscripts.map((ochs) => (
              <div key={ochs.slug} className="search-hit-item">
                <div className="search-hit-header">
                  <span className="db-badge">OCHS #{ochs.ochsNumber}</span>
                  <strong className="hit-title">
                    {ochs.titleSanskrit} ({ochs.slug})
                  </strong>
                </div>
                <div className="hit-snippet">{ochs.verses[0]?.sanskritIast}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
export default SiddhamBijaAcademy;
