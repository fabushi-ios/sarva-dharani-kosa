import React, { useState, useEffect, useCallback } from 'react';
import type { DharaniItem, DharaniVerse, SyllableAnalysis, AudioEngineMode, NeuralVoice } from '../../types/dharani';
import type { DisplayLayerSettings } from '../../services/storageService';
import { DEFAULT_DISPLAY_LAYERS } from '../../services/storageService';
import { CURATED_SEED_SYLLABLES } from '../../data/corpus';
import { CBETA_AUTH_RECORDS } from '../../data/generated/cbetaAuthRecords';
import { analyzeSanskritLine } from '../../core/prosody';
import {
  sanskritAudioEngine,
  playSingleSyllable,
  stopSanskritSpeech
} from '../../services/sanskritAudioEngine';
import { VerseBlock } from './VerseBlock';
import { CbetaSiddhamInterlinearView } from './CbetaSiddhamInterlinearView';
import { AuthoritativeSourceModal } from './AuthoritativeSourceModal';

interface DharaniReaderProps {
  entry: DharaniItem;
  layers: DisplayLayerSettings;
  onUpdateLayers: (layers: DisplayLayerSettings) => void;
}

const LAYER_META: { key: keyof DisplayLayerSettings; label: string }[] = [
  { key: 'showSiddham', label: '悉昙梵字' },
  { key: 'showDevanagari', label: '天城体梵文' },
  { key: 'showIast', label: 'IAST转写' },
  { key: 'showProsodyMeter', label: '音节与轻重律' },
  { key: 'showIpa', label: 'IPA音标' },
  { key: 'showTangTranslit', label: '唐宋古音译' },
  { key: 'showModernPhonetic', label: '现代助读' },
  { key: 'showMeaningZh', label: '汉语意译' },
  { key: 'showMeaningEn', label: 'English Gloss' },
  { key: 'showWordGloss', label: '逐词语法卡片' }
];

function getHeroSeed(entry: DharaniItem) {
  const deityStr = (entry.deity + ' ' + entry.titleZh).toLowerCase();
  if (deityStr.includes('觀音') || deityStr.includes('観音') || deityStr.includes('avalokite')) {
    return CURATED_SEED_SYLLABLES.find((s) => s.id === 'bija-hrih') || CURATED_SEED_SYLLABLES[0];
  }
  if (deityStr.includes('文殊') || deityStr.includes('mañjuśrī')) {
    return CURATED_SEED_SYLLABLES.find((s) => s.id === 'bija-dhih') || CURATED_SEED_SYLLABLES[0];
  }
  if (deityStr.includes('尊勝') || deityStr.includes('佛頂') || deityStr.includes('uṣṇīṣa')) {
    return CURATED_SEED_SYLLABLES.find((s) => s.id === 'bija-bhrum') || CURATED_SEED_SYLLABLES[0];
  }
  if (deityStr.includes('金剛') || deityStr.includes('明王') || deityStr.includes('vajra')) {
    return CURATED_SEED_SYLLABLES.find((s) => s.id === 'bija-hum') || CURATED_SEED_SYLLABLES[0];
  }
  return CURATED_SEED_SYLLABLES[0];
}

export const DharaniReader: React.FC<DharaniReaderProps> = ({
  entry,
  layers,
  onUpdateLayers
}) => {
  const [activeVerseIdx, setActiveVerseIdx] = useState<number>(-1);
  const [activeSyllableIdx, setActiveSyllableIdx] = useState<number>(-1);
  const [isPlayingFull, setIsPlayingFull] = useState<boolean>(false);
  const [droneEnabled, setDroneEnabled] = useState<boolean>(false);
  const [audioMode, setAudioMode] = useState<AudioEngineMode>(sanskritAudioEngine.getMode());
  const [voice, setVoice] = useState<NeuralVoice>(sanskritAudioEngine.getVoice());
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(sanskritAudioEngine.getSpeed());
  const [showSourceModal, setShowSourceModal] = useState<boolean>(false);
  const [readerMode, setReaderMode] = useState<'verses' | 'cbeta-tt'>('verses');

  // 检查当前条目是否关联了 CBETA <cb:tt> 悉昙梵汉逐字对音记录
  const cbetaId = entry.cbetaInterlinearXmlId || entry.authoritativeSource.cbetaXmlId;
  const cbetaRecord = CBETA_AUTH_RECORDS.find(
    (r) => r.xmlId === cbetaId || r.taishoNo === cbetaId
  );
  const hasCbetaTtPairs = Boolean(cbetaRecord && cbetaRecord.ttAlignments.length > 0);
  const heroSeed = getHeroSeed(entry);

  // 切换条目时停止正在进行的吟诵并重置模式
  useEffect(() => {
    stopSanskritSpeech();
    setActiveVerseIdx(-1);
    setActiveSyllableIdx(-1);
    setIsPlayingFull(false);
    setReaderMode('verses');
  }, [entry.id]);

  // 切换 136.1Hz 宇宙音 Om 持续背景音场
  const handleToggleDrone = () => {
    const next = sanskritAudioEngine.toggleOmDrone();
    setDroneEnabled(next);
  };

  const handleSelectMode = (m: AudioEngineMode) => {
    sanskritAudioEngine.setMode(m);
    setAudioMode(m);
  };

  const handleSelectVoice = (v: NeuralVoice) => {
    sanskritAudioEngine.setVoice(v);
    setVoice(v);
  };

  const handleSelectSpeed = (spd: number) => {
    sanskritAudioEngine.setSpeed(spd);
    setSpeedMultiplier(spd);
  };

  // 播放单个音节
  const handlePlaySingleSyllable = useCallback(
    (syl: SyllableAnalysis) => {
      void playSingleSyllable(syl, {
        mode: audioMode,
        voice,
        speed: speedMultiplier
      });
    },
    [audioMode, voice, speedMultiplier]
  );

  // 播放单节咒文
  const handlePlayVerse = useCallback(
    async (verse: DharaniVerse, _syllables: SyllableAnalysis[]) => {
      const vIdx = entry.verses.findIndex((v) => v.verseNumber === verse.verseNumber);
      if (activeVerseIdx === vIdx) {
        stopSanskritSpeech();
        setActiveVerseIdx(-1);
        setActiveSyllableIdx(-1);
        setIsPlayingFull(false);
        return;
      }

      setIsPlayingFull(false);
      setActiveVerseIdx(vIdx);
      setActiveSyllableIdx(0);

      await sanskritAudioEngine.speakText(verse.iast, {
        mode: audioMode,
        voice,
        speed: speedMultiplier,
        onSyllableHighlight: (sIdx) => {
          setActiveSyllableIdx(sIdx);
        },
        onComplete: () => {
          setActiveVerseIdx(-1);
          setActiveSyllableIdx(-1);
        }
      });
    },
    [entry.verses, activeVerseIdx, audioMode, voice, speedMultiplier]
  );

  // 全文连续梵音念诵
  const handlePlayFullDharani = async () => {
    if (isPlayingFull || activeVerseIdx !== -1) {
      stopSanskritSpeech();
      setIsPlayingFull(false);
      setActiveVerseIdx(-1);
      setActiveSyllableIdx(-1);
      return;
    }

    setIsPlayingFull(true);

    for (let i = 0; i < entry.verses.length; i++) {
      const v = entry.verses[i];
      setActiveVerseIdx(i);
      setActiveSyllableIdx(0);

      let wasCancelled = false;
      await new Promise<void>((resolve) => {
        void sanskritAudioEngine
          .speakText(v.iast, {
            mode: audioMode,
            voice,
            speed: speedMultiplier,
            onSyllableHighlight: (sIdx) => {
              setActiveSyllableIdx(sIdx);
            },
            onComplete: () => {
              resolve();
            }
          })
          .catch(() => {
            wasCancelled = true;
            resolve();
          });
      });

      if (wasCancelled) break;
    }

    setIsPlayingFull(false);
    setActiveVerseIdx(-1);
    setActiveSyllableIdx(-1);
  };

  const toggleLayer = (key: keyof DisplayLayerSettings) => {
    onUpdateLayers({
      ...layers,
      [key]: !layers[key]
    });
  };

  const handleToggleAllLayers = (enableAll: boolean) => {
    if (enableAll) {
      onUpdateLayers(DEFAULT_DISPLAY_LAYERS);
    } else {
      onUpdateLayers({
        showSiddham: true,
        showDevanagari: true,
        showIast: true,
        showIpa: false,
        showTangTranslit: true,
        showModernPhonetic: false,
        showMeaningZh: true,
        showMeaningEn: false,
        showWordGloss: false,
        showProsodyMeter: true
      });
    }
  };

  return (
    <div className="sdk-reader-container">
      {/* 1. 经典头部横幅与四体经题 */}
      <header className="sdk-dharani-hero">
        <div className="sdk-hero-top">
          <div className="sdk-hero-titles">
            <div className="sdk-hero-badges">
              <span className="sdk-badge-taisho">
                大正藏 {entry.authoritativeSource.cbetaXmlId || entry.taishoId} (
                {entry.authoritativeSource.taishoLocation || entry.period})
              </span>
              <span className="sdk-badge-tradition">本尊：{entry.deity}</span>
              {entry.authoritativeSource.gretilId && (
                <span className="sdk-badge-provenance">
                  GRETIL 梵本：{entry.authoritativeSource.gretilId}
                </span>
              )}
              {hasCbetaTtPairs && cbetaRecord && (
                <span className="sdk-badge-cbeta-tt">
                  含 CBETA 悉昙梵汉逐字对音 ({cbetaRecord.ttAlignmentsCount} 字)
                </span>
              )}
            </div>

            <h2 className="sdk-hero-title-zh">{entry.titleZh}</h2>
            <div className="sdk-hero-title-sa">{entry.titleSanskrit}</div>
            <div className="sdk-hero-title-deva" lang="sa-Deva">
              {entry.titleDevanagari}
            </div>
            <div className="sdk-hero-title-siddham" lang="sa-Sidd">
              {entry.titleSiddham}
            </div>
          </div>

          {/* 根本种子字坛城卡 */}
          <div
            className="sdk-hero-seed-card"
            onClick={() => {
              const seedSyl = analyzeSanskritLine(heroSeed?.iast || 'oṃ', { mode: 'smart' })
                .words[0]?.syllables[0];
              if (seedSyl) handlePlaySingleSyllable(seedSyl);
            }}
            title="点击聆听本尊根本种子字 48kHz 原生梵音与 136.1Hz 共振"
          >
            <div className="sdk-seed-card-label">本尊种子字 (Bīja)</div>
            <div className="sdk-seed-card-siddham" lang="sa-Sidd">
              {heroSeed?.siddham || '𑖼'}
            </div>
            <div className="sdk-seed-card-deva" lang="sa-Deva">
              {heroSeed?.devanagari || 'ॐ'}
            </div>
            <div className="sdk-seed-card-sub">
              {heroSeed?.iast || 'oṃ'} · 古音「{heroSeed?.tangChinese || '唵'}」
            </div>
            <div className="sdk-seed-card-hint">🔊 点击听音</div>
          </div>
        </div>

        {/* 译者、梵本引证与功德简介 */}
        <div className="sdk-hero-meta-grid">
          <div className="sdk-meta-box">
            <div className="sdk-meta-box-title">📜 历代译者与传承</div>
            <div className="sdk-meta-box-content">
              {entry.translator} · {entry.period}
            </div>
          </div>
          <div className="sdk-meta-box">
            <div className="sdk-meta-box-title">🏛️ 梵文底本与学术校勘引证</div>
            <div className="sdk-meta-box-content">
              {entry.authoritativeSource.sanskritEditionCitation}
            </div>
          </div>
          <div className="sdk-meta-box sdk-meta-box-wide">
            <div className="sdk-meta-box-title">🪷 经典源流与修持功德</div>
            <div className="sdk-meta-box-content">
              {entry.summaryZh} {entry.ritualBenefits}
            </div>
          </div>
        </div>

        {/* 2. 语音合成控制台 + 视图模式切换 + 原典溯源按钮 */}
        <div className="sdk-audio-toolbar">
          <div className="sdk-audio-left">
            <button
              type="button"
              className={`sdk-btn-play-all ${isPlayingFull ? 'playing' : ''}`}
              onClick={handlePlayFullDharani}
            >
              {isPlayingFull ? '⏹ 停止全篇吟诵' : '▶ 全篇梵音连续吟诵 (逐音节高亮)'}
            </button>

            <button
              type="button"
              className={`sdk-btn-drone ${droneEnabled ? 'active' : ''}`}
              onClick={handleToggleDrone}
              title="开启 136.1Hz 宇宙音 Om (Sadja) 坦普拉琴持续泛音背景场"
            >
              {droneEnabled ? '🔔 136.1Hz 梵音背景场：开启中' : '🔕 开启 136.1Hz Om 共振背景场'}
            </button>

            {/* 发音引擎模式与男/女声切换 */}
            <div className="sdk-audio-mode-switch" title="切换 48kHz 原生梵文神经网络 VITS 模型与 136.1Hz 共振峰合成器">
              <button
                type="button"
                className={`sdk-mode-btn ${
                  audioMode === 'neural-auto' || audioMode === 'neural-tts' ? 'active' : ''
                }`}
                onClick={() => handleSelectMode('neural-auto')}
              >
                48kHz 神经VITS
              </button>
              <button
                type="button"
                className={`sdk-mode-btn ${audioMode === 'synth' ? 'active' : ''}`}
                onClick={() => handleSelectMode('synth')}
              >
                136.1Hz 共振峰
              </button>
              <button
                type="button"
                className={`sdk-mode-btn ${voice === 'male' ? 'active' : ''}`}
                onClick={() => handleSelectVoice(voice === 'male' ? 'female' : 'male')}
                title="切换男声 (sa.onnx) / 女声 (sa_female.onnx)"
              >
                {voice === 'male' ? '🧔 男声' : '👩 女声'}
              </button>
            </div>

            <div className="sdk-speed-control">
              <label>吟诵语速：</label>
              {[
                { val: 0.7, label: '0.7x 慢速教读' },
                { val: 0.9, label: '0.9x 标准庄严' },
                { val: 1.15, label: '1.15x 流利持诵' }
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  className={`sdk-speed-btn ${speedMultiplier === s.val ? 'active' : ''}`}
                  onClick={() => handleSelectSpeed(s.val)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sdk-audio-right">
            {hasCbetaTtPairs && cbetaRecord && (
              <div className="sdk-view-mode-switch">
                <button
                  type="button"
                  className={`sdk-view-btn ${readerMode === 'verses' ? 'active' : ''}`}
                  onClick={() => setReaderMode('verses')}
                >
                  十维分段精解 ({entry.verses.length} 节)
                </button>
                <button
                  type="button"
                  className={`sdk-view-btn ${readerMode === 'cbeta-tt' ? 'active' : ''}`}
                  onClick={() => setReaderMode('cbeta-tt')}
                >
                  CBETA 悉昙逐字对音 ({cbetaRecord.ttAlignmentsCount} 字)
                </button>
              </div>
            )}

            <button
              type="button"
              className="sdk-btn-source"
              onClick={() => setShowSourceModal(true)}
            >
              🏛️ 查看权威原典源文件 (CBETA / GRETIL)
            </button>
          </div>
        </div>
      </header>

      {/* 3. 十维显示层级自由开关面板 */}
      {readerMode === 'verses' && (
        <section className="sdk-layer-toggles-bar" aria-label="显示层级控制">
          <div className="sdk-layer-bar-title">👁️ 十维显示层级定制：</div>
          <div className="sdk-layer-chips">
            {LAYER_META.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`sdk-layer-toggle-btn ${layers[item.key] ? 'active' : ''}`}
                onClick={() => toggleLayer(item.key)}
              >
                {layers[item.key] ? '✓ ' : ''}
                {item.label}
              </button>
            ))}
          </div>
          <div className="sdk-layer-presets">
            <button
              type="button"
              className="sdk-preset-link"
              onClick={() => handleToggleAllLayers(true)}
            >
              全选十维
            </button>
            <button
              type="button"
              className="sdk-preset-link"
              onClick={() => handleToggleAllLayers(false)}
            >
              精简修持模式
            </button>
          </div>
        </section>
      )}

      {/* 4. 主体内容区：十维分段卡片 或 CBETA <cb:tt> 悉昙逐字对音矩阵 */}
      {readerMode === 'cbeta-tt' && cbetaRecord ? (
        <CbetaSiddhamInterlinearView record={cbetaRecord} />
      ) : (
        <div className="sdk-verses-list">
          {entry.verses.map((verse, idx) => (
            <VerseBlock
              key={`${entry.id}-v-${verse.verseNumber}`}
              verse={verse}
              layers={layers}
              isActiveVerse={activeVerseIdx === idx}
              activeSyllableIdx={activeVerseIdx === idx ? activeSyllableIdx : -1}
              onPlayVerse={handlePlayVerse}
              onPlaySingleSyllable={handlePlaySingleSyllable}
            />
          ))}
        </div>
      )}

      {/* 5. 权威原典溯源弹窗 */}
      {showSourceModal && (
        <AuthoritativeSourceModal entry={entry} onClose={() => setShowSourceModal(false)} />
      )}
    </div>
  );
};
