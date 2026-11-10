import React, { useState, useMemo } from 'react';
import { analyzeSanskritLine } from '../../core/prosody';
import {
  iastToSlp1,
  slp1ToDevanagari,
  slp1ToSiddhamUnicode,
  iastToIpa
} from '../../core/transliterator';
import type { DharaniItem, DharaniVerse } from '../../types/dharani';
import {
  sanskritAudioEngine,
  playSingleSyllable,
  stopSanskritSpeech
} from '../../services/sanskritAudioEngine';

interface CustomDharaniCompilerProps {
  customEntries: DharaniItem[];
  onSaveCustomDharani: (entry: DharaniItem) => void;
  onSelectCompiledEntry: (id: string) => void;
}

const SAMPLE_INPUTS = [
  {
    label: '文殊八字大威德真言',
    titleZh: '文殊八字大威德陀罗尼 (T1184)',
    deity: '八字文殊菩萨',
    text: 'oṃ āḥ vī ra hūṃ kha ca raḥ'
  },
  {
    label: '大随求根本心中心真言',
    titleZh: '普遍光明清净炽盛如意宝印心无能胜大明王大随求陀罗尼心咒 (T1153)',
    deity: '大随求菩萨 (Mahāpratisarā)',
    text: 'oṃ bhara bhara saṃbhara saṃbhara indriya viśodhani hūṃ hūṃ ruru cale svāhā'
  },
  {
    label: '毗卢遮那大灌顶光真言',
    titleZh: '不空羂索毗卢遮那佛大灌顶光真言 (T1002)',
    deity: '毗卢遮那如来 (Vairocana)',
    text: 'oṃ amogha vairocana mahāmudrā maṇi padma jvāla pravartaya hūṃ'
  },
  {
    label: '宝箧印陀罗尼根本心咒',
    titleZh: '一切如来心秘密全身舍利宝箧印陀罗尼根本咒 (T1022B)',
    deity: '十方三世一切如来',
    text: 'namaḥ sarva tathāgatānām | oṃ vipula garbhe maṇi prabhe tathāgata nidarśane maṇi maṇi suprabhe vimale sāgara gambhīre hūṃ hūṃ jvala jvala बुद्ध vilokite guhya adhiṣṭhita garbhe svāhā'
  }
];

export const CustomDharaniCompiler: React.FC<CustomDharaniCompilerProps> = ({
  customEntries,
  onSaveCustomDharani,
  onSelectCompiledEntry
}) => {
  const [titleZh, setTitleZh] = useState('不空羂索毗卢遮那佛大灌顶光真言');
  const [titleSa, setTitleSa] = useState('Amogha-vairocana-mahāmudrā-dhāraṇī');
  const [deityFocus, setDeityFocus] = useState('毗卢遮那如来 (Vairocana)');
  const [taishoRef, setTaishoRef] = useState('T19n1002');
  const [rawInput, setRawInput] = useState(
    'oṃ amogha vairocana mahāmudrā maṇi padma jvāla pravartaya hūṃ'
  );
  const [inputMode, setInputMode] = useState<'smart' | 'strict' | 'slp1'>('smart');
  const [activeSylIdx, setActiveSylIdx] = useState<number>(-1);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // 实时按句号/换行/竖线切分并编译每一节
  const compiledLines = useMemo(() => {
    const rawSegments = rawInput
      .split(/\n+|\|\||\|/)
      .map((s) => s.trim())
      .filter(Boolean);
    return rawSegments.map((seg) =>
      analyzeSanskritLine(seg, { mode: inputMode, longMarkSymbol: '～' })
    );
  }, [rawInput, inputMode]);

  const handlePlayPreviewLine = async (iastText: string) => {
    if (isSpeaking) {
      stopSanskritSpeech();
      setIsSpeaking(false);
      setActiveSylIdx(-1);
      return;
    }
    setIsSpeaking(true);
    await sanskritAudioEngine.speakText(iastText, {
      onSyllableHighlight: (idx) => setActiveSylIdx(idx),
      onComplete: () => {
        setIsSpeaking(false);
        setActiveSylIdx(-1);
      }
    });
  };

  const handleSaveToCorpus = () => {
    if (compiledLines.length === 0) return;

    const id = `custom-${Date.now()}`;
    const verses: DharaniVerse[] = compiledLines.map((line, idx) => {
      const modernApprox = line.words.map((w) => w.wordModernPhonetic).join(' ');
      const tangChinese = line.words.map((w) => w.wordTangReconstruction).join(' ');
      return {
        verseNumber: idx + 1,
        sectionTitle: `自定义编译第 ${idx + 1} 节`,
        iast: line.normalizedIast,
        devanagari: line.devanagari,
        siddham: line.siddhamUnicode,
        ipa: iastToIpa(line.normalizedIast),
        tangChinese,
        modernApprox,
        meaningZh:
          '（由 100% 梵音编译器自动生成之四体文字、三十四字母唐音矩阵与轻重格律解析）',
        meaningEn:
          '(Auto-compiled quad-script transliteration, Tang Siddhaṃ phonetics & Chandas prosody)',
        tangPhoneticNotes: ['编译器生成'],
        words: line.words.map((w) => ({
          sanskrit: w.wordIast,
          devanagari: w.wordDevanagari,
          siddham: w.wordSiddham,
          rootOrStem: w.syllables.map((s) => s.rawIast).join('·'),
          grammar: w.syllables
            .map((s) => `${s.varga || '音节'}(${s.weight === 'Guru' ? '重—' : '轻⏑'})`)
            .join(' / '),
          tangPhonetic: w.wordTangReconstruction || '',
          meaningZh: w.syllables.map((s) => s.acousticNote || '').filter(Boolean).join('；'),
          meaningEn: `Phonetic: ${w.wordModernPhonetic || w.wordIast}`
        }))
      };
    });

    const slpTitle = iastToSlp1(titleSa || titleZh, 'smart');
    const newEntry: DharaniItem = {
      id,
      titleZh: titleZh.trim() || '自定义编译梵文陀罗尼',
      shortTitleZh: (titleZh.trim() || '自定义梵咒').slice(0, 8),
      titleSanskrit: titleSa.trim() || compiledLines[0].normalizedIast,
      titleDevanagari: slp1ToDevanagari(slpTitle),
      titleSiddham: slp1ToSiddhamUnicode(slpTitle),
      titleEn: titleSa.trim() || 'Custom Compiled Sanskrit Dhāraṇī',
      category: 'custom',
      deity: deityFocus.trim() || '十方三世一切诸佛菩萨',
      taishoId: taishoRef.trim() || 'Custom',
      translator: '梵音宝典 100% 全覆盖四体声学编译器',
      period: '当代数字化校勘',
      summaryZh:
        '通过梵音宝典「100% 全覆盖四体声学编译器」实时编译生成，完整支持悉昙、天城、IAST、IPA、唐宋玄奘/不空体音译、现代梵音助读与 48kHz VITS / 136.1Hz 共振峰发声。',
      ritualBenefits: '正音持诵，字字分明，契合悉昙声明学轻重格律。',
      verses,
      authoritativeSource: {
        cbetaXmlId: taishoRef.trim() || 'Custom',
        cbetaRawUrl: 'https://github.com/cbeta-org/xml-p5',
        taishoLocation: `Ref: ${taishoRef}`,
        sanskritEditionCitation:
          'Compiled via Sarva-Dhāraṇī-Kośa 34×14 Akṣara Phonetic Matrix',
        tangPhoneticNotes: [
          '采用三遍式梵文音节切分器 (3-Pass Akṣara Syllabifier)',
          '支持随韵 Anusvāra (ṃ) 五类鼻音同化与止息 Visarga (ḥ) 元音回响'
        ],
        rawExcerpt: rawInput,
        crossRefs: {}
      }
    };

    onSaveCustomDharani(newEntry);
    onSelectCompiledEntry(id);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(compiledLines, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${titleSa.replace(/\s+/g, '_') || 'custom_dharani'}_compiled.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sdk-compiler">
      <div className="sdk-compiler-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 className="sdk-compiler-title">
              ⚡ 梵文陀罗尼 100% 全覆盖四体转换与声学编译器 (Universal Dhāraṇī Compiler)
            </h2>
            <p className="sdk-compiler-desc">
              输入大藏经或梵文贝叶经中的<strong>任意</strong>梵文陀罗尼（支持天城体 Devanāgarī、标准 IAST、粗略英文拼写如{' '}
              <code>om mani padme hum</code> 或哈佛-京都 SLP1），引擎将瞬间完成：
              <strong>① 悉昙/天城/IAST/IPA 四体转写</strong> ·{' '}
              <strong>② 三遍式梵文音节切分与轻重格律 (Guru/Laghu) 判定</strong> ·{' '}
              <strong>③ 唐代玄奘/不空三十四字母双轨对音</strong> ·{' '}
              <strong>④ 48kHz 原生梵文神经网络 VITS 模型与 136.1Hz 共振峰发声</strong>。
            </p>
          </div>
          <a
            href="/sanskrit_phonetic_engine.html"
            target="_blank"
            rel="noopener noreferrer"
            className="sdk-btn-source"
            style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            🚀 打开独立版发音引擎 v3.0 (四线谱 + 34×14矩阵) ↗
          </a>
        </div>
      </div>

      <div className="sdk-compiler-grid">
        {/* 左侧：输入与元数据配置 */}
        <div className="sdk-compiler-input-panel">
          <div className="sdk-Preset-bar">
            <span className="sdk-preset-label">快速载入经典范例：</span>
            {SAMPLE_INPUTS.map((s) => (
              <button
                key={s.label}
                type="button"
                className="sdk-preset-chip"
                onClick={() => {
                  setTitleZh(s.titleZh);
                  setDeityFocus(s.deity);
                  setRawInput(s.text);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="sdk-form-row">
            <div className="sdk-form-field">
              <label>中文经咒名称：</label>
              <input
                type="text"
                value={titleZh}
                onChange={(e) => setTitleZh(e.target.value)}
                placeholder="例如：不空羂索毗卢遮那佛大灌顶光真言"
              />
            </div>
            <div className="sdk-form-field">
              <label>梵文标题 (IAST)：</label>
              <input
                type="text"
                value={titleSa}
                onChange={(e) => setTitleSa(e.target.value)}
                placeholder="例如：Amogha-vairocana-mahāmudrā"
              />
            </div>
          </div>

          <div className="sdk-form-row">
            <div className="sdk-form-field">
              <label>修持本尊：</label>
              <input
                type="text"
                value={deityFocus}
                onChange={(e) => setDeityFocus(e.target.value)}
              />
            </div>
            <div className="sdk-form-field">
              <label>大正藏 / 文献出处编号：</label>
              <input
                type="text"
                value={taishoRef}
                onChange={(e) => setTaishoRef(e.target.value)}
              />
            </div>
          </div>

          <div className="sdk-form-field">
            <div className="sdk-textarea-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <label>输入任意梵文咒语（支持天城体 / IAST / 粗略拉丁拼写，用 | 或换行分段）：</label>
              <div className="sdk-mode-radios" style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem' }}>
                {(['smart', 'strict', 'slp1'] as const).map((m) => (
                  <label key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="inputMode"
                      checked={inputMode === m}
                      onChange={() => setInputMode(m)}
                    />
                    {m === 'smart' ? '智能纠错 (Smart)' : m === 'strict' ? '严格 IAST' : 'SLP1 编码'}
                  </label>
                ))}
              </div>
            </div>
            <textarea
              rows={5}
              className="sdk-compiler-textarea"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="在此粘贴任意梵文陀罗尼..."
            />
          </div>

          <div className="sdk-compiler-actions">
            <button
              type="button"
              className="sdk-btn-primary-gold"
              onClick={handleSaveToCorpus}
            >
              💾 保存至宝典总持库并进入十维精读视图
            </button>
            <button
              type="button"
              className="sdk-btn-secondary"
              onClick={handleExportJson}
            >
              📥 导出结构化 JSON 数据包
            </button>
          </div>

          {customEntries.length > 0 && (
            <div className="sdk-saved-custom-list" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <h4 style={{ marginBottom: '0.5rem' }}>已保存在本地的自定义编译陀罗尼 ({customEntries.length} 部)：</h4>
              <div className="sdk-saved-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {customEntries.map((ce) => (
                  <button
                    key={ce.id}
                    type="button"
                    className="sdk-preset-chip"
                    onClick={() => onSelectCompiledEntry(ce.id)}
                  >
                    📜 {ce.titleZh}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：实时十维编译预览与交互发声 */}
        <div className="sdk-compiler-preview-panel">
          <div className="sdk-preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <h3>✨ 实时四体文字、唐音矩阵与声学编译结果 ({compiledLines.length} 节)</h3>
          </div>

          {compiledLines.map((line, lIdx) => {
            const allSyls = line.words.flatMap((w) => w.syllables);
            const tradFull = line.words.map((w) => w.wordTangReconstruction).join(' ');
            const modernFull = line.words.map((w) => w.wordModernPhonetic).join(' ');
            return (
              <div key={lIdx} className="sdk-compiled-card" style={{ background: '#fffdf9', border: '1px solid var(--border-gold)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <div className="sdk-compiled-card-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="sdk-verse-num">编译分节 #{lIdx + 1}</span>
                  <button
                    type="button"
                    className="sdk-verse-play-btn"
                    onClick={() => handlePlayPreviewLine(line.normalizedIast)}
                  >
                    {isSpeaking ? '⏹ 停止试听' : '▶ 48kHz VITS 连续吟诵本节'}
                  </button>
                </div>

                <div className="sdk-layer-row">
                  <span className="sdk-layer-label">悉昙梵字</span>
                  <div className="sdk-siddham-line" lang="sa-Sidd">
                    {line.siddhamUnicode}
                  </div>
                </div>
                <div className="sdk-layer-row">
                  <span className="sdk-layer-label">天城体梵文</span>
                  <div className="sdk-devanagari-line" lang="sa-Deva">
                    {line.devanagari}
                  </div>
                </div>
                <div className="sdk-layer-row">
                  <span className="sdk-layer-label">标准 IAST</span>
                  <div className="sdk-iast-line">{line.normalizedIast}</div>
                </div>
                <div className="sdk-layer-row">
                  <span className="sdk-layer-label">IPA 音标</span>
                  <div className="sdk-ipa-line">/{iastToIpa(line.normalizedIast)}/</div>
                </div>
                <div className="sdk-layer-row">
                  <span className="sdk-layer-label">玄奘/不空体</span>
                  <div className="sdk-tang-line">{tradFull}</div>
                </div>
                <div className="sdk-layer-row">
                  <span className="sdk-layer-label">现代梵音助读</span>
                  <div className="sdk-modern-phonetic-line">{modernFull}</div>
                </div>

                <div className="sdk-syllable-matrix-wrap">
                  <div className="sdk-syllable-matrix-title">
                    逐音节轻重格律与声学解剖（点击任意音节试听 48kHz VITS / 136.1Hz 梵音）：
                  </div>
                  <div className="sdk-syllable-strip">
                    {allSyls.map((s, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        className={`sdk-syl-chip ${activeSylIdx === sIdx ? 'active' : ''} ${
                          s.weight === 'Guru' ? 'guru' : 'laghu'
                        }`}
                        onClick={() => void playSingleSyllable(s)}
                        title={s.acousticNote || ''}
                      >
                        <span className="syl-meter-tag">
                          {s.meterSymbol || (s.weight === 'Guru' ? '—' : '⏑')}{' '}
                          {s.weight === 'Guru' ? '重(2拍)' : '轻(1拍)'}
                        </span>
                        <span className="syl-siddham" lang="sa-Sidd">
                          {s.siddhamUnicode}
                        </span>
                        <span className="syl-deva" lang="sa-Deva">
                          {s.devanagari}
                        </span>
                        <span className="syl-iast">{s.rawIast}</span>
                        <span className="syl-ipa">[{s.ipa}]</span>
                        <span className="syl-tang">{s.tangReconstruction}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
