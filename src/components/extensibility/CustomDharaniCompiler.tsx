import React, { useState, useMemo } from 'react';
import { analyzeSanskritSentence } from '../../core/prosody';
import { sanskritAudioEngine } from '../../services/sanskritAudioEngine';
import { DharaniEntry } from '../../types/dharani';

interface CustomDharaniCompilerProps {
  customDharanis: DharaniEntry[];
  onSaveCustomDharani: (entry: DharaniEntry) => void;
  onRemoveCustomDharani: (id: string) => void;
  onSelectDharani: (id: string) => void;
}

const PRESET_EXAMPLES = [
  {
    label: '《心经》心咒',
    input: 'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā',
    titleZh: '般若波罗蜜多心咒',
    tang: '怛侄他 唵 揭谛 揭谛 波罗揭谛 波罗僧揭谛 菩提 萨婆诃',
    meaning: '即说咒曰：唵！去吧，去吧，到彼岸去吧，大家一起到彼岸去吧，觉悟圆满！'
  },
  {
    label: '六字大明咒 (简易输入)',
    input: 'om mani padme hum',
    titleZh: '观自在菩萨六字大明陀罗尼',
    tang: '唵 嘛呢 叭咪 吽',
    meaning: '敬礼莲华上之摩尼宝珠（悲智双运之自性清净心）！'
  },
  {
    label: '文殊五字真言',
    input: 'oṃ a ra pa ca na dhīḥ',
    titleZh: '文殊师利菩萨五字真言',
    tang: '唵 阿 啰 跛 者 娜 渧',
    meaning: '悟入一切法本不生、离言说相、离尘垢、无生灭之般若大智！'
  },
  {
    label: '不动明王慈救咒',
    input: 'namaḥ samanta vajrāṇāṃ caṇḍa mahāroṣaṇa sphoṭaya hūṃ traṭ hāṃ māṃ',
    titleZh: '不动明王慈救陀罗尼',
    tang: '南么 三曼多 伐折罗赧 战荼 摩诃嚧洒拏 萨破吒也 吽 怛罗吒 憾 𤚥',
    meaning: '普遍敬礼一切金刚部众！暴恶大忿怒尊，摧破一切无明业障，吽！'
  },
  {
    label: '天城体直接输入示例',
    input: 'ॐ तारे तुत्तारे तुरे स्वाहा',
    titleZh: '圣救度母心咒（绿度母心咒）',
    tang: '嗡 达列 都达列 都列 梭哈',
    meaning: '敬礼救度母、拔济八难母、速疾赐成就母，吉祥圆满！'
  }
];

export const CustomDharaniCompiler: React.FC<CustomDharaniCompilerProps> = ({
  customDharanis,
  onSaveCustomDharani,
  onRemoveCustomDharani,
  onSelectDharani
}) => {
  const [inputMode, setInputMode] = useState<'smart' | 'strict' | 'slp1'>('smart');
  const [rawInput, setRawInput] = useState(
    'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā'
  );
  const [titleZh, setTitleZh] = useState('自定义梵文陀罗尼');
  const [titleSkt, setTitleSkt] = useState('Svakṛta-Dhāraṇī');
  const [tangTranslit, setTangTranslit] = useState(
    '怛侄他 唵 揭谛 揭谛 波罗揭谛 波罗僧揭谛 菩提 萨婆诃'
  );
  const [meaningZh, setMeaningZh] = useState(
    '即说咒曰：唵！去吧，去吧，到彼岸去吧，大家一起到彼岸去吧，觉悟圆满！'
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  const analyzed = useMemo(
    () => analyzeSanskritSentence(rawInput, inputMode),
    [rawInput, inputMode]
  );

  const handleSaveToCorpus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analyzed.iast.trim()) return;

    const newEntry: DharaniEntry = {
      id: `custom-${Date.now()}`,
      titleZh: titleZh.trim() || '自定义陀罗尼',
      titleSaIast: titleSkt.trim() || analyzed.iast,
      titleSaDeva: analyzed.devanagari,
      titleSaSiddham: analyzed.siddham,
      titleEn: 'Custom Compiled Dhāraṇī',
      category: 'major',
      deityFocus: '十方诸佛菩萨总持',
      seedSyllableIast: 'oṃ',
      seedSyllableSiddham: '𑖼𑗀',
      seedSyllableDeva: 'ॐ',
      seedSyllableZh: '唵',
      summaryZh: meaningZh.trim() || '由梵音 100% 全覆盖编译器实时生成的陀罗尼条目。',
      ritualBenefitsZh: '支持悉昙、天城、IAST、现代直拼、唐密古音及 136.1Hz 共振峰禅诵合成。',
      sourceMeta: {
        cbetaXmlId: 'Custom-Compiler',
        cbetaRawUrl: 'https://github.com/cbeta-org/xml-p5',
        taishoVolPage: '自建数字梵夹',
        ancientTranslator: '梵音100%全覆盖编译器实时生成',
        sanskritEditionCitation: 'Sarva-Dhāraṇī-Kośa Real-time Phonetic Engine v2.0',
        tangPhoneticNotes: ['自动执行随韵五类同化、止韵元音回响及轻重音节格律分析']
      },
      verses: [
        {
          id: `custom-v1-${Date.now()}`,
          index: 1,
          sectionTag: '全文',
          iast: analyzed.iast,
          devanagari: analyzed.devanagari,
          siddham: analyzed.siddham,
          ipa: analyzed.ipa,
          tangTranslit: tangTranslit.trim() || analyzed.tradFull,
          modernPhonetic: analyzed.modernFull,
          meaningZh: meaningZh.trim() || '自定义陀罗尼句子',
          meaningEn: 'Custom compiled Sanskrit Dhāraṇī verse',
          words: analyzed.syllables.map(s => ({
            iast: s.iast,
            devanagari: s.devanagari,
            siddham: s.siddham,
            tangTranslit: s.tangTranslit,
            yinNote: s.meter === '—' ? '重音(Guru)' : '轻音(Laghu)',
            grammar: s.varga,
            meaningZh: `直拼：${s.modernPhonetic}`,
            meaningEn: s.note
          }))
        }
      ]
    };

    onSaveCustomDharani(newEntry);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="sdk-compiler">
      <div className="sdk-compiler-header">
        <div>
          <span className="sdk-badge sdk-badge-gold">
            100% 梵音双轨拆解 + 四体实时同步编译
          </span>
          <h2 className="sdk-section-title">梵文四体转写与 100% 全覆盖注音发声工作台</h2>
          <p className="sdk-section-desc">
            支持输入任意<strong>标准 IAST 罗马转写、无音标简易英文（如 <code>om mani padme hum</code>）、天城体梵文（<code>ॐ मणि पद्मे हूँ</code>）或学术 SLP1 编码</strong>，
            引擎自动进行 Akṣara 音节切分，实时生成<strong>悉昙体、天城体、国际音标 IPA、现代直拼汉字轨、唐密古音轨</strong>及轻重音律谱，并可一键收入经藏。
          </p>
        </div>
      </div>

      <div className="sdk-compiler-presets">
        <span className="sdk-preset-label">快速载入经典范例：</span>
        {PRESET_EXAMPLES.map(ex => (
          <button
            key={ex.label}
            type="button"
            className="sdk-chip"
            onClick={() => {
              setRawInput(ex.input);
              setTitleZh(ex.titleZh);
              setTangTranslit(ex.tang);
              setMeaningZh(ex.meaning);
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="sdk-compiler-grid">
        <div className="sdk-compiler-input-col">
          <div className="sdk-input-mode-bar">
            {([
              { id: 'smart', label: '智能容错模式 (支持 IAST / 天城体 / 简易无音标英文)' },
              { id: 'strict', label: '严格学术 IAST 模式' },
              { id: 'slp1', label: '学术 SLP1 单字符编码' }
            ] as const).map(m => (
              <button
                key={m.id}
                type="button"
                className={`sdk-chip ${inputMode === m.id ? 'active' : ''}`}
                onClick={() => setInputMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <textarea
            className="sdk-textarea"
            rows={4}
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            placeholder="在此输入任意梵文咒语（支持 IAST、天城体或简易拼音，如 om tare tuttare ture svaha）..."
          />

          <div className="sdk-compiler-audio-actions">
            <button
              type="button"
              className="sdk-btn sdk-btn-primary"
              onClick={() =>
                sanskritAudioEngine.speakVerseIast(analyzed.iast, { mode: 'auto', rate: 0.82 })
              }
            >
              🔊 寺院深沉梵音连续吟诵 (Auto TTS + 共振峰)
            </button>
            <button
              type="button"
              className="sdk-btn sdk-btn-outline"
              onClick={() =>
                sanskritAudioEngine.speakVerseIast(analyzed.iast, { mode: 'synth', rate: 0.72 })
              }
            >
              🎙️ 136.1Hz 共振峰慢速逐音节跟读 (0.72x)
            </button>
          </div>

          <form className="sdk-save-form" onSubmit={handleSaveToCorpus}>
            <h4>📥 保存至本地《梵音宝典》个人经匣</h4>
            <div className="sdk-form-row">
              <label>
                汉文咒名
                <input
                  type="text"
                  className="sdk-input"
                  value={titleZh}
                  onChange={e => setTitleZh(e.target.value)}
                />
              </label>
              <label>
                梵文标题 (IAST)
                <input
                  type="text"
                  className="sdk-input"
                  value={titleSkt}
                  onChange={e => setTitleSkt(e.target.value)}
                />
              </label>
            </div>
            <label>
              传统汉语音译（选填，留空则自动采用引擎唐密古音轨）
              <input
                type="text"
                className="sdk-input"
                value={tangTranslit}
                onChange={e => setTangTranslit(e.target.value)}
              />
            </label>
            <label>
              汉文义释与修持功德
              <input
                type="text"
                className="sdk-input"
                value={meaningZh}
                onChange={e => setMeaningZh(e.target.value)}
              />
            </label>
            <div className="sdk-form-actions">
              <button type="submit" className="sdk-btn sdk-btn-gold">
                💾 编译并存入经藏曲库
              </button>
              {saveSuccess && <span className="sdk-save-toast">✓ 已成功存入个人经匣！</span>}
            </div>
          </form>
        </div>

        <div className="sdk-compiler-output-col">
          <div className="sdk-output-card">
            <div className="sdk-output-row">
              <span className="sdk-script-tag">悉昙梵字 (Siddhaṃ)</span>
              <div className="sdk-script-siddham siddham-text">{analyzed.siddham}</div>
            </div>
            <div className="sdk-output-row">
              <span className="sdk-script-tag">天城体 (Devanāgarī)</span>
              <div className="sdk-script-deva deva-text">{analyzed.devanagari}</div>
            </div>
            <div className="sdk-output-row">
              <span className="sdk-script-tag">标准转写 (IAST)</span>
              <div className="sdk-script-iast">{analyzed.iast}</div>
            </div>
            <div className="sdk-output-row">
              <span className="sdk-script-tag">国际音标 (IPA)</span>
              <div className="sdk-script-ipa">{analyzed.ipa}</div>
            </div>
            <div className="sdk-output-row">
              <span className="sdk-script-tag">轨道 A · 现代直拼谐音</span>
              <div className="sdk-script-modern">{analyzed.modernFull}</div>
            </div>
            <div className="sdk-output-row">
              <span className="sdk-script-tag">轨道 B · 唐密佛经古音</span>
              <div className="sdk-script-tang">{analyzed.tradFull}</div>
            </div>
            <div className="sdk-output-row">
              <span className="sdk-script-tag">轻重音律 (Chandas)</span>
              <div className="sdk-prosody-summary">
                共 {analyzed.syllables.length} 音节 · Guru 重音 (—) {analyzed.guruCount} · Laghu 轻音 (⌣) {analyzed.laghuCount}
              </div>
            </div>
          </div>

          <div className="sdk-syllable-inspector">
            <h4>🔬 Akṣara 逐音节声学拆解与共振峰参数（点击任意音节独立发声）</h4>
            <div className="sdk-word-cards">
              {analyzed.syllables.map((s, idx) => (
                <button
                  key={`${s.rawSlp}-${idx}`}
                  type="button"
                  className="sdk-word-card"
                  onClick={() =>
                    sanskritAudioEngine.playSingleSyllableIast(s.rawSlp, 'auto', 0.8, true)
                  }
                  title={`${s.note} | F1=${s.f1}Hz, F2=${s.f2}Hz`}
                >
                  <div className="sdk-word-top">
                    <span className="sdk-word-siddham siddham-text">{s.siddham}</span>
                    <span className="sdk-word-deva deva-text">{s.devanagari}</span>
                  </div>
                  <div className="sdk-word-iast">
                    {s.iast} <small>({s.meter})</small>
                  </div>
                  <div className="sdk-word-ipa">{s.ipa}</div>
                  <div className="sdk-word-tracks">
                    <span className="sdk-track-badge sdk-track-easy">直拼：{s.modernPhonetic}</span>
                    <span className="sdk-track-badge sdk-track-trad">古音：{s.tangTranslit}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {customDharanis.length > 0 && (
        <div className="sdk-custom-list-section">
          <h3>已保存的自定义陀罗尼 ({customDharanis.length} 部)</h3>
          <div className="sdk-custom-cards">
            {customDharanis.map(item => (
              <div key={item.id} className="sdk-custom-card">
                <div>
                  <h4>{item.titleZh}</h4>
                  <p className="sdk-muted">{item.titleSaIast}</p>
                </div>
                <div className="sdk-custom-card-actions">
                  <button
                    type="button"
                    className="sdk-btn sdk-btn-sm sdk-btn-primary"
                    onClick={() => onSelectDharani(item.id)}
                  >
                    在阅读器中打开
                  </button>
                  <button
                    type="button"
                    className="sdk-btn sdk-btn-sm sdk-btn-outline"
                    onClick={() => onRemoveCustomDharani(item.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
