import React, { useState, useMemo } from 'react';
import { Code2, PlusCircle, Volume2, Download, Trash2, Sparkles } from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';
import {
  iastToDevanagari,
  iastToIpa,
  iastToSiddham,
} from '../../core/sanskrit/transliterator';
import { analyzeSanskritProsody } from '../../core/sanskrit/prosody';
import {
  generateVerseChinesePhonetics,
  mapSyllableToChinesePhonetics,
} from '../../core/sanskrit/phoneticMapper';

interface CustomDharaniCompilerProps {
  customEntries: DharaniEntry[];
  onAddCustomEntry: (entry: DharaniEntry) => void;
  onDeleteCustomEntry: (id: string) => void;
  onSelectEntryInReader: (id: string) => void;
  onPlaySyllable: (iast: string) => void;
}

const PRESET_TEMPLATES = [
  {
    label: '文殊八字大威德真言',
    titleZh: '一切佛心大无畏八字真言（文殊八字咒）',
    deityZh: '八字文殊菩萨',
    iast: 'oṃ āḥ vī ra hūṃ kha ca raḥ ||',
    translitZh: '唵 阿 味 啰 吽 佉 左 洛 ||',
    meaningZh: '嗡！阿、味、啰、吽、佉、左、洛（一切如来大威德总持心印）！',
  },
  {
    label: '毗卢遮那佛大灌顶光真言',
    titleZh: '不空羂索毗卢遮那佛大灌顶光真言',
    deityZh: '大日如来 (Vairocana)',
    iast: 'oṃ amogha vairocana mahāmudrā maṇi padma jvāla pravartaya hūṃ ||',
    translitZh: '唵 阿谟伽 尾嚧左曩 摩诃母捺啰 摩抳 钵纳摩 入嚩攞 钵啰靺多野 吽 ||',
    meaningZh: '嗡！不空遍照如来大印，摩尼宝与莲华光明炽盛流转，吽！',
  },
  {
    label: '绿度母增福慧随心咒',
    titleZh: '圣救度佛母增福慧随心真言',
    deityZh: '圣救度佛母 (Ārya-Tārā)',
    iast: 'oṃ tāre tuttāre ture mama āyuḥpuṇyajñānapuṣṭiṃ kuru svāhā ||',
    translitZh: '唵 多隶 咄多隶 都隶 摩摩 阿瑜布尼耶枳娘曩补瑟徴 俱噜 娑嚩诃 ||',
    meaningZh: '嗡！度母、救苦度母、疾速母！请令我之寿命、福德、智慧皆得增长广大，圆满成就！',
  },
];

export const CustomDharaniCompiler: React.FC<CustomDharaniCompilerProps> = ({
  customEntries,
  onAddCustomEntry,
  onDeleteCustomEntry,
  onSelectEntryInReader,
  onPlaySyllable,
}) => {
  const [titleZh, setTitleZh] = useState('自定梵文陀罗尼章句');
  const [deityZh, setDeityZh] = useState('本尊总持');
  const [iastInput, setIastInput] = useState(
    'oṃ tāre tuttāre ture mama āyuḥpuṇyajñānapuṣṭiṃ kuru svāhā ||'
  );
  const [translitZh, setTranslitZh] = useState('');
  const [meaningZh, setMeaningZh] = useState(
    '嗡！圣救度母啊！祈请令我寿命、福德与般若智慧皆悉圆满增长，吉祥成就！'
  );
  const [showBracketIast, setShowBracketIast] = useState(false);

  const siddhamOut = useMemo(() => iastToSiddham(iastInput), [iastInput]);
  const devanagariOut = useMemo(() => iastToDevanagari(iastInput), [iastInput]);
  const ipaOut = useMemo(() => iastToIpa(iastInput), [iastInput]);
  const prosodyOut = useMemo(() => analyzeSanskritProsody(iastInput), [iastInput]);
  const autoPhonetics = useMemo(
    () => generateVerseChinesePhonetics(iastInput, showBracketIast),
    [iastInput, showBracketIast]
  );

  const effectiveClassicalZh = translitZh.trim() || autoPhonetics.classicalTranslitZh;

  const handleSaveToCorpus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!iastInput.trim()) return;

    const newEntry: DharaniEntry = {
      id: `custom-${Date.now()}`,
      titleZh: titleZh.trim() || '自定义梵文陀罗尼',
      titleSanskritIast: iastInput.trim().slice(0, 60),
      titleEnglish: 'User Compiled Sanskrit Dhāraṇī Module',
      categoryId: 'custom',
      taishoNo: 'CUSTOM-MODULE',
      translatorZh: '梵咒实时编译器生成',
      sutraSourceZh: '用户模块化扩展语料',
      deityZh: deityZh.trim() || '诸佛菩萨总持',
      meritsAndSummaryZh: meaningZh.trim(),
      recitationTipsZh: '由系统自动根据 IAST 元音长短与复辅音规则计算摩多轻重律。',
      provenance: {
        sourceType: 'Academic-Critical-Edition',
        editionCitation: 'Compiled via Sarva-Dhāraṇī-Kośa Live Sanskrit Phonetic Compiler',
        manuscriptNotesZh: '用户本地持久化模块，可随时导出为标准 JSON。',
      },
      verses: [
        {
          id: `custom-v-${Date.now()}`,
          index: 1,
          iast: iastInput.trim(),
          classicalTranslitZh: effectiveClassicalZh,
          modernPhoneticZh: autoPhonetics.modernPhoneticZh,
          meaningZh: meaningZh.trim(),
          meaningEn: 'Custom compiled Sanskrit mantra verse.',
          words: [],
        },
      ],
    };

    onAddCustomEntry(newEntry);
    onSelectEntryInReader(newEntry.id);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(customEntries, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sarva-dharani-custom-modules.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="section-panel">
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
        <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Code2 size={20} color="var(--accent-vermilion)" />
          <span>梵文陀罗尼实时六体转写编译器与模块化语料扩展台</span>
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          输入任意罗马转写梵文（IAST），系统即时编译为唐代悉昙梵字、梵音拼读参考、天城体、古汉语音译、国际音标（IPA）与摩多轻重律（Guru/Laghu）。
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>快速载入范例模板：</span>
        {PRESET_TEMPLATES.map((tpl) => (
          <button
            key={tpl.label}
            type="button"
            className="btn-scholarly"
            onClick={() => {
              setTitleZh(tpl.titleZh);
              setDeityZh(tpl.deityZh);
              setIastInput(tpl.iast);
              setTranslitZh(tpl.translitZh);
              setMeaningZh(tpl.meaningZh);
            }}
          >
            {tpl.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSaveToCorpus} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label htmlFor="compiler-title-input" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              陀罗尼汉文名号：
            </label>
            <input
              id="compiler-title-input"
              type="text"
              className="header-search-input"
              style={{ paddingLeft: '0.75rem', marginTop: '0.25rem' }}
              value={titleZh}
              onChange={(e) => setTitleZh(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="compiler-iast-input" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              梵文 IAST 原文（支持 ā ī ū ṛ ṃ ḥ ś ṣ ṇ ṭ ḍ ñ）：
            </label>
            <textarea
              id="compiler-iast-input"
              rows={3}
              className="header-search-input iast-text"
              style={{ paddingLeft: '0.75rem', marginTop: '0.25rem', fontSize: '1rem' }}
              value={iastInput}
              onChange={(e) => setIastInput(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="compiler-translit-input" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              自定义唐宋古汉语音译（留空则由系统自动对音）：
            </label>
            <input
              id="compiler-translit-input"
              type="text"
              placeholder={autoPhonetics.classicalTranslitZh}
              className="header-search-input"
              style={{ paddingLeft: '0.75rem', marginTop: '0.25rem' }}
              value={translitZh}
              onChange={(e) => setTranslitZh(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="compiler-meaning-input" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              汉文意译与功德说明：
            </label>
            <textarea
              id="compiler-meaning-input"
              rows={2}
              className="header-search-input"
              style={{ paddingLeft: '0.75rem', marginTop: '0.25rem' }}
              value={meaningZh}
              onChange={(e) => setMeaningZh(e.target.value)}
            />
          </div>

          <button id="compiler-save-btn" type="submit" className="btn-scholarly primary" style={{ justifyContent: 'center', padding: '0.6rem' }}>
            <PlusCircle size={16} />
            <span>编译并收录入梵音宝典词库</span>
          </button>
        </div>

        {/* Live Multi-Script & Prosody Preview */}
        <div className="verse-card">
          <div className="verse-card-header">
            <span className="verse-index-badge">实时六体编译预览 (Live 6-Script Output)</span>
            <button
              type="button"
              className={`btn-scholarly ${showBracketIast ? 'gold' : ''}`}
              onClick={() => setShowBracketIast((b) => !b)}
            >
              <Sparkles size={13} />
              <span>拼读括号(IAST)：{showBracketIast ? '已开启' : '已关闭'}</span>
            </button>
          </div>

          <div className="script-row">
            <span className="script-label">悉昙梵字</span>
            <div className="script-content-siddham">{siddhamOut}</div>
          </div>

          <div className="script-row">
            <span className="script-label" style={{ color: 'var(--accent-jade)' }}>
              梵音拼读参考
            </span>
            <div className="script-content-phonetic-zh">{autoPhonetics.modernPhoneticZh}</div>
          </div>

          <div className="script-row">
            <span className="script-label">天城梵文</span>
            <div className="script-content-devanagari">{devanagariOut}</div>
          </div>

          <div className="script-row">
            <span className="script-label">梵文 IAST</span>
            <div className="script-content-iast">{iastInput}</div>
          </div>

          <div className="script-row">
            <span className="script-label" style={{ color: 'var(--accent-vermilion)' }}>
              古汉语音译
            </span>
            <div className="script-content-classical-zh">{effectiveClassicalZh}</div>
          </div>

          <div className="script-row">
            <span className="script-label">国际音标</span>
            <div className="script-content-ipa">/{ipaOut}/</div>
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              实时摩多轻重音律切分（点击任意音节试听合成梵音）：
            </div>
            <div className="prosody-syllables-strip">
              {prosodyOut.map((syl) => {
                const mapped = mapSyllableToChinesePhonetics(syl.iast);
                return (
                  <button
                    key={`comp-syl-${syl.index}`}
                    type="button"
                    className={`syllable-pill ${syl.weight}`}
                    onClick={() => onPlaySyllable(syl.iast)}
                  >
                    <span className="syl-meter">{syl.weight === 'guru' ? '—' : '⌣'}</span>
                    <span className="syl-iast">{syl.iast}</span>
                    <span className="syl-modern-zh">{mapped.modernZh}</span>
                    <span className="syl-tang-zh">{mapped.classicalZh}</span>
                    <span className="syl-ipa">[{syl.ipa}]</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </form>

      {customEntries.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '0.95rem' }}>已扩展收录之自定义梵咒模块 ({customEntries.length})</h3>
            <button type="button" className="btn-scholarly" onClick={handleExportJson}>
              <Download size={14} />
              <span>导出 JSON 模块文件</span>
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {customEntries.map((ce) => (
              <div
                key={ce.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.7rem',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs)',
                }}
              >
                <button
                  type="button"
                  style={{ fontWeight: 600, fontSize: '0.84rem' }}
                  onClick={() => onSelectEntryInReader(ce.id)}
                >
                  {ce.titleZh}
                </button>
                <button
                  type="button"
                  onClick={() => onPlaySyllable(ce.verses[0]?.iast || '')}
                  title="试听"
                >
                  <Volume2 size={14} color="var(--accent-vermilion)" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCustomEntry(ce.id)}
                  title="删除"
                >
                  <Trash2 size={14} color="var(--text-muted)" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
