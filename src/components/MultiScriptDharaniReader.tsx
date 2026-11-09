import React, { useState, useMemo } from 'react';
import type { DharaniCategory, DharaniItem, ScriptDisplayLayer } from '../types/dharani';
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
  sanskritAudioEngine,
  speakSanskrit,
  stopSpeaking,
} from '../services/sanskritAudioEngine';
import { AuthoritativeSourceModal } from './AuthoritativeSourceModal';

export function MultiScriptDharaniReader() {
  const [customDharanis, setCustomDharanis] = useState<DharaniItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DharaniCategory | 'all'>('all');
  const [selectedDharaniId, setSelectedDharaniId] = useState<string>(
    BASELINE_CURATED_DHARANIS[0].id
  );
  const [sourceModalItem, setSourceModalItem] = useState<DharaniItem | null>(null);
  const [showCompiler, setShowCompiler] = useState<boolean>(false);
  const [customTitleZh, setCustomTitleZh] = useState<string>('佛頂尊勝心真言 (自訂校勘本)');
  const [customTitleSkt, setCustomTitleSkt] = useState<string>('Uṣṇīṣavijayā Hṛdaya Mantra');
  const [customTaishoId, setCustomTaishoId] = useState<string>('T19n0967-custom');
  const [customVersesRaw, setCustomVersesRaw] = useState<string>(
    'oṃ bhrūṃ svāhā |禮敬佛頂輪王一字種子\noṃ amṛta āyurdade svāhā |祈請無量甘露長壽加持'
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

  const allDharanis = useMemo(
    () => [...customDharanis, ...BASELINE_CURATED_DHARANIS],
    [customDharanis]
  );

  const filteredDharanis = useMemo(() => {
    if (selectedCategory === 'all') return allDharanis;
    return allDharanis.filter((d) => d.category === selectedCategory);
  }, [selectedCategory, allDharanis]);

  const selectedDharani = useMemo(
    () =>
      allDharanis.find((d) => d.id === selectedDharaniId) ||
      allDharanis[0],
    [selectedDharaniId, allDharanis]
  );

  const lineAnalysis = useMemo(
    () => analyzeSanskritLine(phoneticsInput, { mode: 'smart', assimilate: true }),
    [phoneticsInput]
  );

  const lineMeterString = useMemo(
    () =>
      lineAnalysis.words
        .flatMap((w) => w.syllables.map((s) => `${s.rawIast}(${s.meterSymbol || (s.weight === 'Guru' ? '—' : '⏑')})`))
        .join(' · '),
    [lineAnalysis]
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

  const handleSaveCustomDharani = () => {
    const rawLines = customVersesRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (rawLines.length === 0) return;

    const compiledVerses = rawLines.map((lineStr, idx) => {
      const [sktPart, zhPart] = lineStr.split('|').map((s) => s.trim());
      const analysis = analyzeSanskritLine(sktPart || 'oṃ svāhā', {
        mode: 'smart',
        assimilate: true,
      });
      const tangLine = analysis.words
        .map((w) => w.wordTangReconstruction || w.syllables.map((s) => s.tangReconstruction).join(''))
        .join(' ');
      const modLine = analysis.words
        .map((w) => w.wordModernPhonetic || w.syllables.map((s) => s.modernPhonetic).join(''))
        .join(' ');
      const ipaLine = analysis.words
        .flatMap((w) => w.syllables.map((s) => s.ipa))
        .join(' ');

      return {
        verseNumber: idx + 1,
        sectionTitle: `第 ${idx + 1} 頌`,
        siddham: analysis.siddhamUnicode,
        devanagari: analysis.devanagari,
        iast: analysis.normalizedIast,
        ipa: ipaLine,
        tangChinese: tangLine,
        modernApprox: modLine,
        meaningZh: zhPart || '自訂梵文陀羅尼密咒句義',
        meaningEn: 'Custom compiled Sanskrit dhāraṇī verse',
        tangPhoneticNotes: ['二合連音自動推導'],
        words: analysis.words.map((w) => ({
          sanskrit: w.wordIast,
          devanagari: w.wordDevanagari,
          siddham: w.wordSiddham,
          rootOrStem: w.wordIast,
          grammar: 'Mantrapada (真言詞節)',
          tangPhonetic: w.wordTangReconstruction || w.syllables.map((s) => s.tangReconstruction).join(''),
          meaningZh: w.syllables.find((s) => s.bijaMeaning)?.bijaMeaning || '梵音詞節',
          meaningEn: 'Sanskrit mantra token',
        })),
      };
    });

    const newItem: DharaniItem = {
      id: `custom-${Date.now()}`,
      category: 'custom',
      titleZh: customTitleZh.trim() || '自訂梵文陀羅尼',
      shortTitleZh: customTitleZh.trim() || '自訂真言',
      titleSanskrit: customTitleSkt.trim() || 'Custom Dhāraṇī',
      titleDevanagari: compiledVerses[0]?.devanagari || 'ॐ स्वाहा',
      titleSiddham: compiledVerses[0]?.siddham || '𑖼',
      titleEn: customTitleSkt.trim() || 'Custom Dhāraṇī',
      taishoId: customTaishoId.trim() || 'Custom',
      translator: '梵音寶典十層編譯器',
      period: '現代數位校勘',
      deity: '諸佛菩薩總持',
      summaryZh: '由十層陀羅尼編譯器即時生成之多語平行對照真言條目。',
      ritualBenefits: '支援悉曇、天城、IAST、IPA、盛唐擬音、詩律輕重音與 48kHz 神經語音合成。',
      authoritativeSource: {
        cbetaXmlId: customTaishoId.trim() || 'Custom',
        cbetaRawUrl: 'https://github.com/cbeta-org/xml-p5',
        gretilId: 'GRETIL-Custom',
        sanskritEditionCitation: 'User Compiled Multi-Script Critical Edition',
        rawExcerpt: compiledVerses.map((v) => `${v.devanagari} / ${v.iast}`).join('\n'),
        tangPhoneticNotes: ['由 34×14 雙軌音韻矩陣與二合連音規則自動推導。'],
        crossRefs: {
          taishoIds: [customTaishoId.trim() || 'Custom'],
        },
      },
      verses: compiledVerses,
    };

    setCustomDharanis((prev) => [newItem, ...prev]);
    setSelectedDharaniId(newItem.id);
    setShowCompiler(false);
  };

  return (
    <div className="workbench-container">
      <div className="workbench-card">
        <div className="workbench-header-row">
          <div>
            <h2 className="workbench-title">
              梵文音韻・悉曇・詩律輕重音 (Guru / Laghu) 與 48kHz VITS / 136.1 Hz 共振峰發聲引擎 (sanskritAudioEngine)
            </h2>
            <p className="workbench-subtitle">
              雙軌音韻學 (現代國語近似音 + 盛唐長安擬音) · 自動連音同化 (Anusvāra 五類鼻音與 Visarga 擦音) ·
              48,000 Hz 原生古典梵語神經模型 (<code>ninada-vits-sanskrit-48khz</code>) · 基頻 {firstSylProfile.fundamentalHz} Hz (Om 宇宙音) / 次諧波 {firstSylProfile.subHarmonicHz} Hz
            </p>
          </div>
          <div className="pill-group">
            <button
              type="button"
              className="primary-btn"
              onClick={() => void sanskritAudioEngine.speakText(phoneticsInput)}
            >
              🔊 48kHz 梵文神經模型吟誦 (/api/tts)
            </button>
            <button
              type="button"
              className="pill-btn"
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
            <button
              type="button"
              className={`pill-btn ${showCompiler ? 'active' : ''}`}
              onClick={() => setShowCompiler((v) => !v)}
            >
              ⚡ 自訂陀羅尼十層編譯器
            </button>
          </div>
        </div>

        {showCompiler && (
          <div className="script-summary-box" style={{ marginBottom: '1rem', borderColor: '#d97706' }}>
            <div className="workbench-header-row" style={{ marginBottom: '0.5rem' }}>
              <strong style={{ color: '#fbbf24' }}>
                ⚡ 陀羅尼十層實時編譯與本地收錄工作台 (Custom Dhāraṇī 10-Layer Compiler)
              </strong>
              <button type="button" className="primary-btn" onClick={handleSaveCustomDharani}>
                ✓ 編譯並收錄至陀羅尼文庫
              </button>
            </div>
            <div className="search-controls">
              <input
                type="text"
                value={customTitleZh}
                onChange={(e) => setCustomTitleZh(e.target.value)}
                placeholder="漢文陀羅尼名稱"
                className="text-input"
              />
              <input
                type="text"
                value={customTitleSkt}
                onChange={(e) => setCustomTitleSkt(e.target.value)}
                placeholder="梵文陀羅尼名稱 (Sanskrit Title)"
                className="text-input"
              />
              <input
                type="text"
                value={customTaishoId}
                onChange={(e) => setCustomTaishoId(e.target.value)}
                placeholder="大正藏/文獻編號"
                className="text-input"
              />
            </div>
            <textarea
              rows={3}
              value={customVersesRaw}
              onChange={(e) => setCustomVersesRaw(e.target.value)}
              className="text-input"
              style={{ width: '100%', fontFamily: 'monospace' }}
              placeholder="每行一頌，格式：梵文 IAST 或天城體 | 漢文句義解釋"
            />
          </div>
        )}

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
              {lineAnalysis.normalizedIast} ({slp1ToIast(lineAnalysis.slp1)})
            </span>
          </div>
          <div>
            <strong>詩律輕重音格律 (Chandas Meter): </strong>
            <span style={{ color: '#fbbf24', fontFamily: 'monospace' }}>
              {lineMeterString}
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
                onClick={() => {
                  playSingleSyllable(syl.slp1, { mode: 'synth' });
                  void sanskritAudioEngine.playSyllable(syl.slp1);
                }}
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
            精校多語陀羅尼文庫 ({filteredDharanis.length}/{allDharanis.length})
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
            <div className="pill-group">
              <button
                type="button"
                className="pill-btn"
                onClick={() => setSourceModalItem(selectedDharani)}
              >
                📜 CBETA & GRETIL 原文溯源
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  void sanskritAudioEngine.speakText(
                    selectedDharani.verses.map((v) => v.iast).join(' ')
                  )
                }
              >
                🔊 48kHz 吟誦全咒
              </button>
              <button
                type="button"
                className="pill-btn"
                onClick={() =>
                  speakSanskrit(
                    selectedDharani.verses.map((v) => v.iast).join(' '),
                    { mode: 'synth' }
                  )
                }
              >
                播放全咒梵音 (136.1 Hz)
              </button>
            </div>
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

          {selectedDharani.verses.map((v) => {
            const verseProsody = analyzeSanskritLine(v.iast, { mode: 'smart', assimilate: true });
            const verseMeter = verseProsody.words
              .flatMap((w) => w.syllables.map((s) => s.meterSymbol || (s.weight === 'Guru' ? '—' : '⏑')))
              .join(' ');
            return (
              <div key={v.verseNumber} className="verse-block">
                <div className="verse-header">
                  <strong>
                    第 {v.verseNumber} 頌 · {v.sectionTitle}
                  </strong>
                  <div className="pill-group">
                    <button
                      type="button"
                      className="chip-btn"
                      onClick={() => void sanskritAudioEngine.speakText(v.iast)}
                    >
                      🔊 48kHz 本頌發音
                    </button>
                    <button
                      type="button"
                      className="chip-btn"
                      onClick={() => setPhoneticsInput(v.iast)}
                    >
                      載入上方音韻分析器
                    </button>
                  </div>
                </div>
                {activeLayers.siddham && <div className="siddham-script">{v.siddham}</div>}
                {activeLayers.devanagari && <div className="verse-deva">{v.devanagari}</div>}
                {activeLayers.iast && <div className="verse-iast">{v.iast}</div>}
                {activeLayers.ipa && <div className="verse-ipa">IPA: [{v.ipa}]</div>}
                {activeLayers.prosodyMeter && (
                  <div className="verse-ipa">
                    詩律節奏 (Guru/Laghu): <code>{verseMeter}</code>
                  </div>
                )}
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
                {activeLayers.wordGloss && v.words && v.words.length > 0 && (
                  <div className="word-gloss-grid">
                    {v.words.map((w, wIdx) => (
                      <div key={`${v.verseNumber}-w-${wIdx}`} className="word-gloss-card">
                        <div className="word-gloss-top">
                          {w.siddham && (
                            <span className="siddham-script" style={{ fontSize: '1.15rem' }}>
                              {w.siddham}
                            </span>
                          )}
                          <strong>{w.sanskrit}</strong>
                          {w.devanagari && <span className="hit-subtitle">({w.devanagari})</span>}
                        </div>
                        <div className="hit-subtitle">唐音: {w.tangPhonetic}</div>
                        {w.rootOrStem && (
                          <div className="hit-refs">
                            詞根: <code>{w.rootOrStem}</code> · {w.grammar}
                          </div>
                        )}
                        <div className="hit-snippet">{w.meaningZh}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </main>
      </div>

      <AuthoritativeSourceModal
        dharani={sourceModalItem}
        onClose={() => setSourceModalItem(null)}
      />
    </div>
  );
}
export default MultiScriptDharaniReader;
