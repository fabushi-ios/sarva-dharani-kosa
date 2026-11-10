import React from 'react';
import { GraduationCap, Volume2, BookOpen } from 'lucide-react';
import {
  SIDDHAM_VARNAMALA_VOWELS,
  SIDDHAM_CONSONANT_VARGAS,
  type VarnamalaLetter,
} from '../../core/sanskrit/transliterator';

interface SanskritPhoneticsAcademyProps {
  onPlaySyllable: (iast: string) => void;
}

export const SanskritPhoneticsAcademy: React.FC<SanskritPhoneticsAcademyProps> = ({
  onPlaySyllable,
}) => {
  const renderLetterCard = (letter: VarnamalaLetter) => (
    <button
      key={letter.iast}
      type="button"
      className="varna-cell"
      onClick={() => onPlaySyllable(letter.iast)}
      title={`点击听取 ${letter.iast} [${letter.ipa}] 发音 · 字门义理：${letter.bijaMeaningZh}`}
    >
      <span className="siddham-glyph" style={{ fontSize: '1.8rem', color: 'var(--accent-vermilion)' }}>
        {letter.siddham}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
        <span className="devanagari-glyph" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
          {letter.devanagari}
        </span>
        <span className="iast-text" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-lapis)' }}>
          {letter.iast}
        </span>
      </div>
      <span className="ipa-text" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        [{letter.ipa}]
      </span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        唐译：{letter.tangTranslitZh}
      </span>
      <span style={{ fontSize: '0.66rem', color: 'var(--accent-gold)', textAlign: 'center' }}>
        {letter.articulationMethodZh}
      </span>
      <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.25 }}>
        {letter.bijaMeaningZh}
      </span>
      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
        <Volume2 size={10} /> 点击发声
      </span>
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <section className="section-panel">
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap size={22} color="var(--accent-vermilion)" />
            <span>梵文声明学（Śikṣā）与唐密悉昙五十字母（Varṇamālā）发音及字门义理教室</span>
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            依据《大毗卢遮那成佛神变加持经·百字生品》、不空三藏《大孔雀明王经·学念梵音法》及智广《悉昙字记》构建。点击任意悉昙梵字即可触发声学共振峰发音。
          </p>
        </div>

        {/* Tang Dynasty Phonetic Annotation Guide */}
        <div className="hero-meta-grid">
          <div className="meta-box">
            <div className="meta-box-label">一、何谓「二合 / 三合」（Saṃyukta-akṣara）</div>
            <div>
              梵文复辅音连缀时，前辅音失去默认短元音 <code>a</code>（加 Virāma 止音符），与后辅音紧接拼读为一拍。如唐译「娑嚩(二合)诃」即 <strong>svāhā</strong>（不可读作三音节 suō-pó-hē，而应将 s 与 v 连读为 svā）。
            </div>
          </div>
          <div className="meta-box">
            <div className="meta-box-label">二、何谓「引」（Dīrgha 长音 2摩多）</div>
            <div>
              梵文严格区分短元音（a, i, u，1拍 Laghu）与长元音（ā, ī, ū, e, o，2拍 Guru）。唐译本中标注「引」或加「阿」字，即代表长元音需延展满两拍。
            </div>
          </div>
          <div className="meta-box">
            <div className="meta-box-label">三、何谓「弹舌 / 转舌呼」（Retroflex &amp; Tap）</div>
            <div>
              唐译凡汉字左侧加「口」旁（如 <strong>啰、哩、噜</strong>）或注「转舌呼」，均对应梵文舌尖颤音/闪音 <strong>r / ṛ</strong>；凡注「顶音」对应卷舌音 <strong>ṭ, ṭh, ḍ, ḍh, ṇ</strong>。
            </div>
          </div>
          <div className="meta-box">
            <div className="meta-box-label">四、空点（ṃ）与涅槃点（ḥ）</div>
            <div>
              悉昙字顶圆点 <strong>𑖼 (ṃ, Anusvāra)</strong> 称菩提点/空点，收于鼻腔共鸣；字侧双点 <strong>𑖾 (ḥ, Visarga)</strong> 称涅槃点/止声，于元音末送出清净气音。
            </div>
          </div>
        </div>
      </section>

      {/* 14 Vowels (Svara /摩多) */}
      <section className="section-panel">
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <BookOpen size={18} color="var(--accent-gold)" />
          <span>第一部：悉昙摩多韵母表（Svara · 十四音 / 十六摩多）</span>
        </h3>
        <div className="varnamala-grid">
          {SIDDHAM_VARNAMALA_VOWELS.map(renderLetterCard)}
        </div>
      </section>

      {/* 33 Consonants (Vyañjana / 体文) grouped by Varga */}
      {SIDDHAM_CONSONANT_VARGAS.map((varga) => (
        <section key={varga.vargaNameSanskrit} className="section-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.06rem', color: 'var(--text-primary)' }}>
              {varga.vargaNameZh} · <span className="iast-text" style={{ color: 'var(--accent-lapis)' }}>{varga.vargaNameSanskrit}</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              发音部位：{varga.placeZh}
            </span>
          </div>
          <div className="varnamala-grid">
            {varga.letters.map(renderLetterCard)}
          </div>
        </section>
      ))}
    </div>
  );
};
