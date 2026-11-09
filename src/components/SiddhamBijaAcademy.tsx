import React, { useState, useMemo } from 'react';
import {
  decipherBijaSyllable,
  getAllBijaLexiconEntries,
} from '../core/bijaLexiconEngine';
import {
  DB2_TAISHO_EXT_CORPUS,
  DB12_MUKTABODHA_OCHS_CORPUS,
} from '../data/unifiedCorpusRegistry';
import { CONS_MATRIX, VOWEL_IPA_MAP, VOWEL_MAP } from '../data/siddhamMatrix';
import {
  slp1ToDevanagari,
  slp1ToIast,
  slp1ToSiddhamUnicode,
} from '../core/transliterator';
import { playSingleSyllable, sanskritAudioEngine } from '../services/sanskritAudioEngine';

const VOWEL_COLS = [
  { slp: 'a', label: 'a/ā (阿)' },
  { slp: 'i', label: 'i/ī (伊)' },
  { slp: 'u', label: 'u/ū (塢)' },
  { slp: 'f', label: 'ṛ/ḷ (哩)' },
  { slp: 'e', label: 'e (翳)' },
  { slp: 'E', label: 'ai (藹)' },
  { slp: 'o', label: 'o (污)' },
  { slp: 'O', label: 'au (奧)' },
];

export function SiddhamBijaAcademy() {
  const [bijaInput, setBijaInput] = useState<string>('hūṃ');
  const [selectedChapNum, setSelectedChapNum] = useState<number>(1);
  const [selectedVarga, setSelectedVarga] = useState<string>('ALL');

  const allBijaEntries = useMemo(() => getAllBijaLexiconEntries(), []);
  const deciphered = useMemo(() => decipherBijaSyllable(bijaInput), [bijaInput]);

  const selectedChapter = useMemo(
    () =>
      DB2_TAISHO_EXT_CORPUS.siddham18Chapters.find((c) => c.chapterNumber === selectedChapNum) ||
      DB2_TAISHO_EXT_CORPUS.siddham18Chapters[0],
    [selectedChapNum]
  );

  const consonantEntries = useMemo(() => {
    const entries = Object.entries(CONS_MATRIX);
    if (selectedVarga === 'ALL') return entries;
    return entries.filter(([, info]) => info.varga === selectedVarga);
  }, [selectedVarga]);

  const vargaCategories = useMemo(
    () => ['ALL', ...Array.from(new Set(Object.values(CONS_MATRIX).map((c) => c.varga)))],
    []
  );

  const handlePlaySyllable = (slp1: string) => {
    playSingleSyllable(slp1, { mode: 'synth' });
    void sanskritAudioEngine.playSyllable(slp1);
  };

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
            <div className="pill-group">
              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  void sanskritAudioEngine.playSyllable(
                    deciphered.entry?.bijaSlp1 || 'oM'
                  )
                }
              >
                🔊 48kHz 神經種子音 ({deciphered.entry.bijaIast})
              </button>
              <button
                type="button"
                className="pill-btn"
                onClick={() =>
                  playSingleSyllable(deciphered.entry?.bijaSlp1 || 'oM', { mode: 'synth' })
                }
              >
                播放種子字 136.1 Hz 共振音 ({deciphered.entry.bijaIast})
              </button>
            </div>
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
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => handlePlaySyllable(e.bijaSlp1)}
                >
                  🔊 試聽種子字
                </button>
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

      {/* Interactive 14 Svaras + 34x8 Consonant Siddham Matrix (SanskritPhoneticsAcademy) */}
      <div className="workbench-card">
        <div className="workbench-header-row">
          <div>
            <h3 className="section-heading" style={{ marginBottom: '0.2rem' }}>
              悉曇五十音全表 · 14 摩多 (Svaras) 與 34×8 體文雙軌音韻矩陣 (點擊任意字格即時播放 48kHz / 136.1Hz 梵音)
            </h3>
            <p className="workbench-subtitle">
              每一格同步呈現：Unicode 悉曇體 · 天城體 · IAST · 現代聽感近似音 (今) · 盛唐長安對音 (唐)
            </p>
          </div>
          <div className="preset-chips" style={{ marginBottom: 0 }}>
            {vargaCategories.map((v) => (
              <button
                key={v}
                type="button"
                className={`chip-btn ${selectedVarga === v ? 'active' : ''}`}
                onClick={() => setSelectedVarga(v)}
              >
                {v === 'ALL' ? '全部五類聲母 (34 體文)' : v}
              </button>
            ))}
          </div>
        </div>

        <div className="syllable-grid" style={{ marginBottom: '1rem' }}>
          {Object.entries(VOWEL_MAP).map(([slp, [mod, tang]]) => (
            <button
              key={slp}
              type="button"
              className="syllable-card"
              onClick={() => handlePlaySyllable(slp)}
            >
              <div className="siddham-script">{slp1ToSiddhamUnicode(slp)}</div>
              <div className="syl-iast">
                {slp1ToIast(slp)} ({slp1ToDevanagari(slp)})
              </div>
              <div className="syl-phonetics">
                唐:{tang} / 今:{mod}
              </div>
              <div className="syl-meter">[{VOWEL_IPA_MAP[slp]}]</div>
            </button>
          ))}
        </div>

        <div className="matrix-table-wrapper">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>聲母 (Vyañjana)</th>
                {VOWEL_COLS.map((vc) => (
                  <th key={vc.slp}>{vc.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consonantEntries.map(([cSlp, info]) => (
                <tr key={cSlp}>
                  <td>
                    <div className="syl-iast">
                      {slp1ToIast(cSlp)} ({slp1ToDevanagari(cSlp)}) · [{info.ipa}]
                    </div>
                    <div className="syl-meter">{info.varga}</div>
                    <div className="syl-meter">{info.note}</div>
                  </td>
                  {VOWEL_COLS.map((vc, idx) => {
                    const sylSlp = `${cSlp}${vc.slp}`;
                    return (
                      <td
                        key={sylSlp}
                        onClick={() => handlePlaySyllable(sylSlp)}
                        title={`點擊試聽 ${slp1ToIast(sylSlp)}`}
                      >
                        <span className="siddham-script" style={{ fontSize: '1.15rem' }}>
                          {slp1ToSiddhamUnicode(sylSlp)}
                        </span>{' '}
                        <span className="syl-iast">{slp1ToIast(sylSlp)}</span>
                        <div className="syl-phonetics">
                          唐:{info.t[idx]} / 今:{info.m[idx]}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
                  <button
                    key={cell.cellId}
                    type="button"
                    className="syllable-card"
                    onClick={() => handlePlaySyllable(cell.iast)}
                  >
                    <div className="siddham-script">{cell.siddhamUnicode}</div>
                    <div className="syl-iast">{cell.iast}</div>
                    <div className="syl-meter">{cell.cellId}</div>
                  </button>
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
