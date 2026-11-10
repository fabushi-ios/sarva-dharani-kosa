import React, { useState } from 'react';
import { analyzeSanskritLine } from '../../core/prosody';
import { playSingleSyllable } from '../../services/sanskritAudioEngine';
import { SiddhamBijaAcademy } from '../SiddhamBijaAcademy';

interface MatrkaItem {
  iast: string;
  deva: string;
  siddham: string;
  ipa: string;
  tang: string;
  desc: string;
  sdCode: string;
}

const VOWELS_MATRKA: MatrkaItem[] = [
  { iast: 'a', deva: 'अ', siddham: '𑖀', ipa: 'ɐ', tang: '阿 (上声短呼)', desc: '一切法本不生义 · 中央开元音 (1拍)', sdCode: 'SD-A440' },
  { iast: 'ā', deva: 'आ', siddham: '𑖁', ipa: 'ɑː', tang: '阿 (引/长呼)', desc: '寂静义 · 长元音 (2拍 Guru)', sdCode: 'SD-A441' },
  { iast: 'i', deva: 'इ', siddham: '𑖂', ipa: 'i', tang: '伊 (上声)', desc: '根义 · 前高短元音 (1拍)', sdCode: 'SD-A442' },
  { iast: 'ī', deva: 'ई', siddham: '𑖃', ipa: 'iː', tang: '伊 (引)', desc: '灾祸清净义 · 前高长元音 (2拍)', sdCode: 'SD-A443' },
  { iast: 'u', deva: 'उ', siddham: '𑖄', ipa: 'u', tang: '坞 (上声)', desc: '譬喻义 · 后高圆唇短元音 (1拍)', sdCode: 'SD-A444' },
  { iast: 'ū', deva: 'ऊ', siddham: '𑖅', ipa: 'uː', tang: '污 (引)', desc: '损减不可得义 · 后高长元音 (2拍)', sdCode: 'SD-A445' },
  { iast: 'ṛ', deva: 'ऋ', siddham: '𑖆', ipa: 'r̩', tang: '哩 (弹舌)', desc: '神通变化义 · 卷舌成音节颤音 (1拍)', sdCode: 'SD-A446' },
  { iast: 'ṝ', deva: 'ॠ', siddham: '𑖇', ipa: 'r̩ː', tang: '哩 (引)', desc: '戏论断灭义 · 长卷舌成音节音 (2拍)', sdCode: 'SD-A447' },
  { iast: 'ḷ', deva: 'ऌ', siddham: '𑖈', ipa: 'l̩', tang: '嚧 (边音)', desc: '相义 · 齿龈边音成音节 (1拍)', sdCode: 'SD-A448' },
  { iast: 'ḹ', deva: 'ॡ', siddham: '𑖉', ipa: 'l̩ː', tang: '嚧 (引)', desc: '染相清净义 · 长边音成音节 (2拍)', sdCode: 'SD-A449' },
  { iast: 'e', deva: 'ए', siddham: '𑖊', ipa: 'eː', tang: '翳 (去声引)', desc: '求义 · 梵文恒长半闭前元音 (2拍 Guru)', sdCode: 'SD-A44A' },
  { iast: 'ai', deva: 'ऐ', siddham: '𑖋', ipa: 'ɑi̯', tang: '蔼 (引)', desc: '自在义 · 复合长双元音 (2拍 Guru)', sdCode: 'SD-A44B' },
  { iast: 'o', deva: 'ओ', siddham: '𑖌', ipa: 'oː', tang: '污 / 奥 (引)', desc: '瀑流义 · 梵文恒长半闭后圆唇音 (2拍 Guru)', sdCode: 'SD-A44C' },
  { iast: 'au', deva: 'औ', siddham: '𑖍', ipa: 'ɑu̯', tang: '奥 (重引)', desc: '化生义 · 复合长双元音 (2拍 Guru)', sdCode: 'SD-A44D' },
  { iast: 'aṃ', deva: 'अं', siddham: '𑖀𑖼', ipa: 'ɐm', tang: '暗 (空点)', desc: '菩提心随韵 (Anusvāra) · 鼻音共鸣收束', sdCode: 'SD-A44E' },
  { iast: 'aḥ', deva: 'अः', siddham: '𑖀𑖽', ipa: 'ɐh', tang: '恶 (涅槃点)', desc: '大般涅槃止息 (Visarga) · 清声门擦音', sdCode: 'SD-A44F' }
];

interface VargaRow {
  vargaName: string;
  sanskritName: string;
  positionDesc: string;
  consonants: {
    iast: string;
    deva: string;
    siddham: string;
    ipa: string;
    tang: string;
    type: string;
  }[];
}

const PANCA_VARGA_ROWS: VargaRow[] = [
  {
    vargaName: '第一行：牙声 / 喉音 (Ka-varga)',
    sanskritName: 'Kaṇṭhya (Velar · 软腭音)',
    positionDesc: '舌根抵软腭发声（唐代悉昙学称为「牙声」）',
    consonants: [
      { iast: 'ka', deva: 'क', siddham: '𑖎', ipa: 'kɐ', tang: '迦', type: '清不送气' },
      { iast: 'kha', deva: 'ख', siddham: '𑖏', ipa: 'kʰɐ', tang: '佉', type: '清送气' },
      { iast: 'ga', deva: 'ग', siddham: '𑖐', ipa: 'ɡɐ', tang: '伽', type: '浊不送气' },
      { iast: 'gha', deva: 'घ', siddham: '𑖑', ipa: 'ɡʱɐ', tang: 'ဃ (伽重)', type: '浊送气' },
      { iast: 'ṅa', deva: 'ङ', siddham: '𑖒', ipa: 'ŋɐ', tang: '仰', type: '鼻音' }
    ]
  },
  {
    vargaName: '第二行：齿声 / 腭音 (Ca-varga)',
    sanskritName: 'Tālavya (Palatal · 硬腭音)',
    positionDesc: '舌面抵硬腭前部发声（唐代悉昙学称为「齿声」）',
    consonants: [
      { iast: 'ca', deva: 'च', siddham: '𑖓', ipa: 'tɕɐ', tang: '者', type: '清不送气' },
      { iast: 'cha', deva: 'छ', siddham: '𑖔', ipa: 'tɕʰɐ', tang: '车', type: '清送气' },
      { iast: 'ja', deva: 'ज', siddham: '𑖕', ipa: 'dʑɐ', tang: '惹 / 阇', type: '浊不送气' },
      { iast: 'jha', deva: 'झ', siddham: '𑖖', ipa: 'dʑʱɐ', tang: '酇 (重)', type: '浊送气' },
      { iast: 'ña', deva: 'ञ', siddham: '𑖗', ipa: 'ɲɐ', tang: '若 / 攘', type: '鼻音' }
    ]
  },
  {
    vargaName: '第三行：舌声 / 卷舌音 (Ṭa-varga)',
    sanskritName: 'Mūrdhanya (Retroflex · 顶音/卷舌音)',
    positionDesc: '舌尖向上卷曲抵住硬腭顶（唐代音注常标「舌头」「弹舌」）',
    consonants: [
      { iast: 'ṭa', deva: 'ट', siddham: '𑖘', ipa: 'ʈɐ', tang: '吒', type: '清不送气' },
      { iast: 'ṭha', deva: 'ठ', siddham: '𑖙', ipa: 'ʈʰɐ', tang: '侘', type: '清送气' },
      { iast: 'ḍa', deva: 'ड', siddham: '𑖚', ipa: 'ɖɐ', tang: '拏 / 荼', type: '浊不送气' },
      { iast: 'ḍha', deva: 'ढ', siddham: '𑖛', ipa: 'ɖʱɐ', tang: '荼 (重)', type: '浊送气' },
      { iast: 'ṇa', deva: 'ण', siddham: '𑖜', ipa: 'ɳɐ', tang: '拿 / ဏ', type: '鼻音' }
    ]
  },
  {
    vargaName: '第四行：喉声 / 齿音 (Ta-varga)',
    sanskritName: 'Dantya (Dental · 舌尖齿背音)',
    positionDesc: '舌尖轻触上齿背发声（不卷舌）',
    consonants: [
      { iast: 'ta', deva: 'त', siddham: '𑖝', ipa: 't̪ɐ', tang: '多 / 怛', type: '清不送气' },
      { iast: 'tha', deva: 'थ', siddham: '𑖞', ipa: 't̪ʰɐ', tang: '他', type: '清送气' },
      { iast: 'da', deva: 'द', siddham: '𑖟', ipa: 'd̪ɐ', tang: '陀 / 达', type: '浊不送气' },
      { iast: 'dha', deva: 'ध', siddham: '𑖠', ipa: 'd̪ʱɐ', tang: '驮 (重)', type: '浊送气' },
      { iast: 'na', deva: 'न', siddham: '𑖡', ipa: 'n̪ɐ', tang: '那 / 曩', type: '鼻音' }
    ]
  },
  {
    vargaName: '第五行：唇声 / 双唇音 (Pa-varga)',
    sanskritName: 'Oṣṭhya (Labial · 双唇音)',
    positionDesc: '双唇闭合爆破发声（唐代对译「缚 va」常注「合口呼」）',
    consonants: [
      { iast: 'pa', deva: 'प', siddham: '𑖢', ipa: 'pɐ', tang: '波 / 鉢', type: '清不送气' },
      { iast: 'pha', deva: 'फ', siddham: '𑖣', ipa: 'pʰɐ', tang: '颇 / 泮', type: '清送气' },
      { iast: 'ba', deva: 'ब', siddham: '𑖤', ipa: 'bɐ', tang: '婆 / 跋', type: '浊不送气' },
      { iast: 'bha', deva: 'भ', siddham: '𑖥', ipa: 'bʱɐ', tang: '婆 (重) / 婆伽', type: '浊送气' },
      { iast: 'ma', deva: 'म', siddham: '𑖦', ipa: 'mɐ', tang: '摩 / 莽', type: '鼻音' }
    ]
  }
];

const ANTASTHA_USMAN = [
  { iast: 'ya', deva: 'य', siddham: '𑖧', ipa: 'jɐ', tang: '耶 / 药', group: '半元音 (Antastha)' },
  { iast: 'ra', deva: 'र', siddham: '𑖨', ipa: 'rɐ', tang: '啰 (弹舌)', group: '半元音 (Antastha)' },
  { iast: 'la', deva: 'ल', siddham: '𑖩', ipa: 'lɐ', tang: '罗 / 洛', group: '半元音 (Antastha)' },
  { iast: 'va', deva: 'व', siddham: '𑖪', ipa: 'ʋɐ', tang: '缚 (唇齿擦音)', group: '半元音 (Antastha)' },
  { iast: 'śa', deva: 'श', siddham: '𑖫', ipa: 'ɕɐ', tang: '奢 / 烁', group: '擦音 (Ūṣman · 腭音)' },
  { iast: 'ṣa', deva: 'ष', siddham: '𑖬', ipa: 'ʂɐ', tang: '沙 / 瑟', group: '擦音 (Ūṣman · 卷舌)' },
  { iast: 'sa', deva: 'स', siddham: '𑖭', ipa: 'sɐ', tang: '娑 / 萨', group: '擦音 (Ūṣman · 齿音)' },
  { iast: 'ha', deva: 'ह', siddham: '𑖮', ipa: 'ɦɐ', tang: '贺 / 诃', group: '浊气音 (Ūṣman · 喉音)' },
  { iast: 'kṣa', deva: 'क्ष', siddham: '𑖎𑖿𑖬', ipa: 'kʂɐ', tang: '乞洒 (二合)', group: '根本复合字门 (Kṣa)' }
];

const TANG_ANNOTATION_RULES = [
  {
    term: '二合 · 三合',
    sanskrit: 'Saṃyukta-akṣara (复辅音连写)',
    explanation:
      '汉语为单音节文字，无法直接表记梵文无元音阻隔的复辅音（如 pra, kṣa, svā, bhrūṃ）。故不空、玄奘三藏以两个或三个汉字切拼为一音节，第一个字急读轻滑（不带元音），瞬间过渡至第二个字。',
    examples: '鉢啰(二合) = pra · 娑缚(二合) = svā · 勃笼(二合) = bhrūṃ · 萨哩嚩(二合) = sarva'
  },
  {
    term: '引 · 长声',
    sanskrit: 'Dīrgha-svara (长元音 2摩罗)',
    explanation:
      '表示梵文长元音（ā, ī, ū, ṝ, e, ai, o, au）。在陀罗尼持诵中，带「引」注的音节必须延长至短元音的两倍时长（2 Morae / Guru 重音），不可急促滑过。',
    examples: '娑嚩(二合)诃(引) = svāhā · 多(引) = tā · 吽(引) = hūṃ'
  },
  {
    term: '弹舌呼 · 卷舌',
    sanskrit: 'Reph / Mūrdhanya (颤音 r 与顶音 ṭ/ḍ)',
    explanation:
      '汉语音系无舌尖颤音 [r]（大舌音），唐代译师以「啰」「哩」加左口旁并注「弹舌呼」，提示持诵者舌尖轻弹上齿龈发出清亮颤音。',
    examples: '喝啰(二合)怛那 = ratna · 紇哩(二合) = hrīḥ · UX = ra'
  },
  {
    term: '去声 · 上声',
    sanskrit: 'Udātta / Svarita (古印度吠陀高低声调与轻重度)',
    explanation:
      '唐代中天竺与南天竺三藏以二手古四声（平、上、去、入）模拟梵文音节的高低升降与元音松紧：短元音多注「上声」（短促高昂），长元音或重音闭音节多注「去声」（悠长下沉）。',
    examples: '阿(上) = a · 阿(去引) = ā · 伊(上) = i'
  },
  {
    term: '合口呼 · 轻唇',
    sanskrit: 'Va-kāra [ʋ] vs. Ba-kāra [b]',
    explanation:
      '梵文半元音 va [ʋ] 介于唇齿擦音与双唇近音之间，唐代常译为「缚」「嚩」并注「无可反 / 合口呼」，以区别于双唇重塞音 ba/bha（婆/跋）。',
    examples: '萨嚩(二合) = sarva · 婆伽梵 = bhagavān'
  }
];

export const SanskritPhoneticsAcademy: React.FC = () => {
  const [lastPlayed, setLastPlayed] = useState<string>('');

  const handleSpeak = (iast: string) => {
    setLastPlayed(iast);
    const analyzed = analyzeSanskritLine(iast, { mode: 'strict' });
    const syl = analyzed.words[0]?.syllables[0];
    if (syl) {
      void playSingleSyllable(syl);
    }
  };

  return (
    <div className="sdk-academy">
      {/* 头部横幅 */}
      <div className="sdk-academy-hero">
        <h2 className="sdk-academy-title">
          𑖀 悉昙五十字母门 (Siddhaṃ Mātrkā) · 唐代声明学与梵汉对音正音指南
        </h2>
        <p className="sdk-academy-desc">
          依据唐·智广《悉昙字记》(T54n2132)、空海《梵字悉昙字母并释义》(T84n2701) 及《大正藏》密教部原典音注构建。
          点击任意悉昙字门即可通过 48kHz 原生梵文神经网络 VITS 模型与 136.1Hz 共振峰引擎试听纯正梵音。
          {lastPlayed && (
            <span className="sdk-last-played-badge">🔊 正在试听：{lastPlayed}</span>
          )}
        </p>
      </div>

      {/* 一、摩多十六韵（元音字母表） */}
      <section className="sdk-academy-section">
        <h3 className="sdk-sec-heading">
          一、悉昙摩多十六韵（Svara · 14 元音 + 菩提点 aṃ + 涅槃点 aḥ）
        </h3>
        <div className="sdk-matrka-grid">
          {VOWELS_MATRKA.map((v) => (
            <button
              key={v.iast}
              type="button"
              className={`sdk-matrka-card ${lastPlayed === v.iast ? 'active' : ''}`}
              onClick={() => handleSpeak(v.iast)}
            >
              <div className="sdk-matrka-top">
                <span className="sdk-matrka-siddham" lang="sa-Sidd">
                  {v.siddham}
                </span>
                <span className="sdk-matrka-deva" lang="sa-Deva">
                  {v.deva}
                </span>
              </div>
              <div className="sdk-matrka-mid">
                <span className="sdk-matrka-iast">{v.iast}</span>
                <span className="sdk-matrka-ipa">[{v.ipa}]</span>
              </div>
              <div className="sdk-matrka-tang">唐音：{v.tang}</div>
              <div className="sdk-matrka-desc">{v.desc}</div>
              <div className="sdk-matrka-code">CBETA #{v.sdCode}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 二、体文二十五毗声（五类五音口腔部位矩阵） */}
      <section className="sdk-academy-section">
        <h3 className="sdk-sec-heading">
          二、体文五类二十五毗声（Pañca-varga · 五大发音部位 × 清浊送气鼻音严密矩阵）
        </h3>
        <div className="sdk-varga-table-wrap">
          {PANCA_VARGA_ROWS.map((row) => (
            <div key={row.vargaName} className="sdk-varga-block">
              <div className="sdk-varga-header">
                <strong>{row.vargaName}</strong>
                <span>{row.sanskritName}</span>
                <span className="sdk-varga-pos">{row.positionDesc}</span>
              </div>
              <div className="sdk-varga-row-grid">
                {row.consonants.map((c) => (
                  <button
                    key={c.iast}
                    type="button"
                    className={`sdk-varga-cell ${lastPlayed === c.iast ? 'active' : ''}`}
                    onClick={() => handleSpeak(c.iast)}
                  >
                    <span className="sdk-varga-type">{c.type}</span>
                    <div className="sdk-varga-scripts">
                      <span className="sdk-varga-siddham" lang="sa-Sidd">
                        {c.siddham}
                      </span>
                      <span className="sdk-varga-deva" lang="sa-Deva">
                        {c.deva}
                      </span>
                    </div>
                    <div className="sdk-varga-phonetics">
                      <span className="sdk-varga-iast">{c.iast}</span>
                      <span className="sdk-varga-ipa">[{c.ipa}]</span>
                    </div>
                    <div className="sdk-varga-tang">唐音：{c.tang}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 三、遍口声九字（半元音与擦音） */}
      <section className="sdk-academy-section">
        <h3 className="sdk-sec-heading">
          三、遍口声九字（Antastha 半元音 · Ūṣman 齿龈/卷舌/硬腭擦音 · Kṣa 复合字门）
        </h3>
        <div className="sdk-matrka-grid">
          {ANTASTHA_USMAN.map((item) => (
            <button
              key={item.iast}
              type="button"
              className={`sdk-matrka-card ${lastPlayed === item.iast ? 'active' : ''}`}
              onClick={() => handleSpeak(item.iast)}
            >
              <div className="sdk-matrka-top">
                <span className="sdk-matrka-siddham" lang="sa-Sidd">
                  {item.siddham}
                </span>
                <span className="sdk-matrka-deva" lang="sa-Deva">
                  {item.deva}
                </span>
              </div>
              <div className="sdk-matrka-mid">
                <span className="sdk-matrka-iast">{item.iast}</span>
                <span className="sdk-matrka-ipa">[{item.ipa}]</span>
              </div>
              <div className="sdk-matrka-tang">唐音：{item.tang}</div>
              <div className="sdk-matrka-desc">{item.group}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 四、唐代密教音译体例与声明学轻重格律（Guru / Laghu） */}
      <section className="sdk-academy-section">
        <h3 className="sdk-sec-heading">
          四、玄奘 · 不空三藏梵汉对音核心注记（二合 / 引 / 弹舌）与梵文轻重律 (Chandas)
        </h3>
        <div className="sdk-rules-grid">
          {TANG_ANNOTATION_RULES.map((rule) => (
            <div key={rule.term} className="sdk-rule-card">
              <div className="sdk-rule-header">
                <span className="sdk-rule-term">{rule.term}</span>
                <span className="sdk-rule-sa">{rule.sanskrit}</span>
              </div>
              <p className="sdk-rule-exp">{rule.explanation}</p>
              <div className="sdk-rule-ex">
                <strong>经典实例：</strong>
                {rule.examples}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 五、密续种子字辞典 (Bījanighaṇṭu / Uddhārakośa) 与空海悉昙字门破译 */}
      <section className="sdk-academy-section">
        <h3 className="sdk-sec-heading">
          五、密续种子字辞典 (Bījanighaṇṭu / Uddhārakośa · DB #12) 与空海 T84n2701 字门解秘
        </h3>
        <SiddhamBijaAcademy />
      </section>
    </div>
  );
};
