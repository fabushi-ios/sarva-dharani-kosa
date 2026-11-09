import React, { useState, useMemo } from 'react';
import type { DharaniCategory, ScriptDisplayLayer } from '../types/dharani';
import {
  BASELINE_CURATED_DHARANIS,
  DHARANI_CATEGORIES,
} from '../data/unifiedCorpusRegistry';
import { analyzeSanskritLine } from '../core/prosody';
import {
  ewtsToIast,
  inputToSlp1,
  slp1ToDevanagari,
  slp1ToIast,
  slp1ToIpa,
  slp1ToSiddhamUnicode,
} from '../core/transliterator';
import {
  computeSyllableAcousticProfile,
  playSingleSyllable,
  speakSanskrit,
  stopSpeaking,
} from '../services/sanskritAudioEngine';

export function MultiScriptDharaniReader() {
  const [selectedCategory, setSelectedCategory] = useState<DharaniCategory | 'all'>('all');
  const [selectedDharaniId, setSelectedDharaniId] = useState<string>(
    BASELINE_CURATED_DHARANIS[0].id
  );
  const [phoneticsInput, setPhoneticsInput] = useState<string>(
    'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā'
  );
  const [ewtsInput, setEwtsInput] = useState<string>(
    'oM badzra satwa su sa ma ya ma nu pA la ya'
  );
  const [activeLayers, setActiveLayers] = useState<Record<ScriptDisplayLayer, boolean>>({
    siddham: true,
    devanagari: true,
    iast: true,
    ipa: true,
    tangPhonetic: true,
    modernApprox: true,
    meaningZh: true,
    meaningEn: true,
    wordGloss: true,
    prosodyMeter: true,
  });

  const filteredDharanis = useMemo(() => {
    if (selectedCategory === 'all') return BASELINE_CURATED_DHARANIS;
    return BASELINE_CURATED_DHARANIS.filter((d) => d.category === selectedCategory);
  }, [selectedCategory]);

  const selectedDharani = useMemo(
    () =>
      BASELINE_CURATED_DHARANIS.find((d) => d.id === selectedDharaniId) ||
      BASELINE_CURATED_DHARANIS[0],
    [selectedDharaniId]
  );

  const lineAnalysis = useMemo(
    () => analyzeSanskritLine(phoneticsInput, { mode: 'smart', assimilate: true }),
    [phoneticsInput]
  );

  const firstSylProfile = useMemo(() => {
    const firstSlp = lineAnalysis.words[0]?.syllables[0]?.slp1 || 'oM';
    return computeSyllableAcousticProfile(firstSlp);
  }, [lineAnalysis]);

  const convertedEwts = useMemo(() => {
    const iast = ewtsToIast(ewtsInput);
    const slp = inputToSlp1(iast, 'smart');
    return {
      iast,
      slp1: slp,
      devanagari: slp1ToDevanagari(slp),
      siddham: slp1ToSiddhamUnicode(slp),
      ipa: slp1ToIpa(slp),
    };
  }, [ewtsInput]);

  const toggleLayer = (layer: ScriptDisplayLayer) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="workbench-container">
      <div className="workbench-card">
        <div className="workbench-header-row">
          <div>
            <h2 className="workbench-title">
              梵文音韻・悉曇・詩律輕重音 (Guru / Laghu) 與 136.1 Hz 共振峰發聲引擎 (sanskritAudioEngine)
            </h2>
            <p className="workbench-subtitle">
              雙軌音韻學 (現代國語近似音 + 盛唐長安擬音) · 自動連音同化 (Anusvāra 五類鼻音與 Visarga 擦音) ·
              基頻 {firstSylProfile.fundamentalHz} Hz (Om 宇宙音) / 次諧波 {firstSylProfile.subHarmonicHz} Hz
            </p>
          </div>
          <div className="pill-group">
            <button
              type="button"
              className="primary-btn"
              onClick={() => speakSanskrit(phoneticsInput, { mode: 'synth' })}
            >
              播放 136.1 Hz 梵音合成 (Speak Sanskrit)
            </button>
            <button
              type="button"
              className="pill-btn"
              onClick={() => stopSpeaking()}
            >
              停止 (Stop)
            </button>
          </div>
        </div>

        <input
          type="text"
          value={phoneticsInput}
          onChange={(e) => setPhoneticsInput(e.target.value)}
          className="text-input"
          placeholder="輸入 IAST / 天城體 / SLP1 / 悉曇體進行即時音節切分與詩律 (Guru / Laghu) 分析..."
        />

        <div className="preset-chips">
          {[
            'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā',
            'oṃ maṇi padme hūṃ hrīḥ',
            'namaḥ saptānāṃ samyaksaṃbuddhakoṭīnāṃ tadyathā oṃ cale cule cunde svāhā',
            'tadyathā oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye rājasamudgate svāhā',
            'oṃ tāre tuttāre ture svāhā',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              className="chip-btn"
              onClick={() => setPhoneticsInput(preset)}
            >
              {preset.slice(0, 38)}...
            </button>
          ))}
        </div>

        <div className="script-summary-box">
          <div>
            <strong>悉曇體 (Siddhaṃ Unicode): </strong>
            <span className="siddham-script">{lineAnalysis.siddhamUnicode}</span>
          </div>
          <div>
            <strong>天城體 (Devanāgarī): </strong>
            <span>{lineAnalysis.devanagari}</span>
          </div>
          <div>
            <strong>標準轉寫 (IAST / SLP1): </strong>
            <span>
              {lineAnalysis.normalizedIast} ({ slp1ToIast(lineAnalysis.slp1) })
            </span>
          </div>
        </div>

        <div className="syllable-grid">
          {lineAnalysis.words.flatMap((w, wIdx) =>
            w.syllables.map((syl, sIdx) => (
              <button
                key={`${wIdx}-${sIdx}-${syl.slp1}`}
                type="button"
                className="syllable-card"
                onClick={() => playSingleSyllable(syl.slp1, { mode: 'synth' })}
              >
                <div className="siddham-script">{syl.siddhamUnicode}</div>
                <div className="syl-iast">
                  {syl.rawIast} ({syl.devanagari})
                </div>
                <div className="syl-phonetics">
                  唐:{syl.tangReconstruction} / 今:{syl.modernPhonetic}
                </div>
                <div className="syl-meter">
                  [{syl.ipa}] · {syl.weight} ({syl.meterSymbol})
                </div>
                {syl.sandhiNotes.length > 0 && (
                  <div className="syl-sandhi">{syl.sandhiNotes[0]}</div>
                )}
              </button>
            ))
          )}
        </div>

        <div style={{ marginTop: '1rem', borderTop: '1px solid #292524', paddingTop: '0.85rem' }}>
          <strong>藏文擴展轉寫 (rKTs EWTS ↔ Sanskrit IAST / Siddhaṃ 轉換器): </strong>
          <div className="search-controls" style={{ marginTop: '0.4rem' }}>
            <input
              type="text"
              value={ewtsInput}
              onChange={(e) => setEwtsInput(e.target.value)}
              className="text-input"
            />
          </div>
          <div className="hit-subtitle" style={{ marginTop: '0.35rem' }}>
            IAST: <strong>{convertedEwts.iast}</strong> · 天城體: {convertedEwts.devanagari} · 悉曇:{' '}
            <span className="siddham-script" style={{ fontSize: '1.15rem' }}>
              {convertedEwts.siddham}
            </span>{' '}
            · IPA: [{convertedEwts.ipa}]
          </div>
        </div>
      </div>

      <div className="two-col-grid">
        <aside className="workbench-card">
          <h3 className="section-heading">
            精校多語陀羅尼文庫 ({filteredDharanis.length}/{BASELINE_CURATED_DHARANIS.length})
          </h3>
          <div className="preset-chips" style={{ marginBottom: '0.75rem' }}>
            <button
              type="button"
              className={`chip-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              全部
            </button>
            {DHARANI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`chip-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.labelZh}
              </button>
            ))}
          </div>
          <div className="sidebar-list">
            {filteredDharanis.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sidebar-item ${item.id === selectedDharani.id ? 'active' : ''}`}
                onClick={() => setSelectedDharaniId(item.id)}
              >
                <div className="sidebar-item-title">{item.shortTitleZh}</div>
                <div className="sidebar-item-sub">
                  {item.taishoId} · {item.titleSanskrit}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="workbench-card">
          <div className="workbench-header-row">
            <div>
              <h3 className="workbench-title">{selectedDharani.titleZh}</h3>
              <div className="workbench-subtitle">
                {selectedDharani.titleSanskrit} · {selectedDharani.taishoId} ·{' '}
                {selectedDharani.translator} · 本尊: {selectedDharani.deity}
              </div>
            </div>
            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                speakSanskrit(
                  selectedDharani.verses.map((v) => v.iast).join(' '),
                  { mode: 'synth' }
                )
              }
            >
              播放全咒梵音
            </button>
          </div>

          <div className="preset-chips">
            {(Object.keys(activeLayers) as ScriptDisplayLayer[]).map((layer) => (
              <button
                key={layer}
                type="button"
                className={`chip-btn ${activeLayers[layer] ? 'active' : ''}`}
                onClick={() => toggleLayer(layer)}
              >
                {layer}
              </button>
            ))}
          </div>

          <p className="dharani-summary">{selectedDharani.summaryZh}</p>

          {selectedDharani.verses.map((v) => (
            <div key={v.verseNumber} className="verse-block">
              <div className="verse-header">
                <strong>
                  第 {v.verseNumber} 頌 · {v.sectionTitle}
                </strong>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => setPhoneticsInput(v.iast)}
                >
                  載入上方音韻分析器
                </button>
              </div>
              {activeLayers.siddham && <div className="siddham-script">{v.siddham}</div>}
              {activeLayers.devanagari && <div className="verse-deva">{v.devanagari}</div>}
              {activeLayers.iast && <div className="verse-iast">{v.iast}</div>}
              {activeLayers.ipa && <div className="verse-ipa">IPA: [{v.ipa}]</div>}
              {activeLayers.tangPhonetic && (
                <div className="verse-tang">
                  <strong>唐音對勘：</strong> {v.tangChinese}
                </div>
              )}
              {activeLayers.modernApprox && (
                <div className="verse-modern">
                  <strong>現代近似讀音：</strong> {v.modernApprox}
                </div>
              )}
              {activeLayers.meaningZh && (
                <div className="verse-meaning">
                  <strong>漢文義釋：</strong> {v.meaningZh}
                </div>
              )}
              {activeLayers.meaningEn && (
                <div className="verse-meaning">
                  <strong>English Meaning:</strong> {v.meaningEn}
                </div>
              )}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
export default MultiScriptDharaniReader;
