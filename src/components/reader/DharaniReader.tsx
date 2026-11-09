/**
 * 陀罗尼多体总持典主阅读器组件 (src/components/reader/DharaniReader.tsx)
 */

import React, { useState } from 'react';
import {
  Volume2,
  Square,
  Sliders,
  ShieldCheck,
  Table2,
  BookOpen,
  Star
} from 'lucide-react';
import { DharaniEntry, DisplayLayerSettings } from '../../types/dharani';
import { CBETA_SCRIPTURE_RECORDS } from '../../data/generated/cbetaAuthRecords';
import { VerseBlock } from './VerseBlock';
import { CbetaSiddhamInterlinearView } from './CbetaSiddhamInterlinearView';
import { AuthoritativeSourceModal } from './AuthoritativeSourceModal';
import { sanskritAudioEngine, AudioEngineMode } from '../../services/sanskritAudioEngine';

interface DharaniReaderProps {
  entry: DharaniEntry;
  layers: DisplayLayerSettings;
  onToggleLayer: (key: keyof DisplayLayerSettings) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export const DharaniReader: React.FC<DharaniReaderProps> = ({
  entry,
  layers,
  onToggleLayer,
  isFavorite,
  onToggleFavorite
}) => {
  const [audioMode, setAudioMode] = useState<AudioEngineMode>('auto');
  const [speechRate, setSpeechRate] = useState<number>(0.82);
  const [isChantingAll, setIsChantingAll] = useState(false);
  const [viewMode, setViewMode] = useState<'verses' | 'cbeta-tt'>('verses');
  const [showSourceModal, setShowSourceModal] = useState(false);

  const cbetaTtRecord =
    CBETA_SCRIPTURE_RECORDS[entry.sourceMeta.cbetaXmlId] &&
    CBETA_SCRIPTURE_RECORDS[entry.sourceMeta.cbetaXmlId].ttPairCount > 0
      ? CBETA_SCRIPTURE_RECORDS[entry.sourceMeta.cbetaXmlId]
      : null;

  const handleChantEntireDharani = () => {
    if (isChantingAll) {
      sanskritAudioEngine.stop();
      setIsChantingAll(false);
      return;
    }
    const fullIast = entry.verses.map(v => v.iast).join(' | ');
    setIsChantingAll(true);
    sanskritAudioEngine.speakVerseIast(fullIast, {
      mode: audioMode,
      rate: speechRate,
      onEnd: () => setIsChantingAll(false)
    });
  };

  const layerToggles: { key: keyof DisplayLayerSettings; label: string }[] = [
    { key: 'showSiddham', label: '悉昙梵字' },
    { key: 'showDevanagari', label: '天城梵文' },
    { key: 'showIast', label: 'IAST 转写' },
    { key: 'showIpa', label: 'IPA 音标' },
    { key: 'showProsodyMeter', label: '音节格律(—/⌣)' },
    { key: 'showModernPhonetic', label: '现代声学跟读' },
    { key: 'showTangTranslit', label: '唐宋古音译' },
    { key: 'showMeaningZh', label: '汉文意译' },
    { key: 'showMeaningEn', label: '英文意译' },
    { key: 'showWordGloss', label: '逐词八格语法' }
  ];

  return (
    <div className="sdk-reader-container">
      {/* 顶部经题与本尊种子字Banner */}
      <section className="sdk-dharani-hero">
        <div className="sdk-hero-main">
          <div className="sdk-hero-seed-card" title={`本尊种子字: ${entry.seedSyllableIast}`}>
            <div className="sdk-hero-seed-siddham siddham-text">
              {entry.seedSyllableSiddham}
            </div>
            <div className="sdk-hero-seed-sub">
              <span className="deva-text">{entry.seedSyllableDeva}</span> ·{' '}
              <span>{entry.seedSyllableIast}</span> ({entry.seedSyllableZh})
            </div>
          </div>

          <div className="sdk-hero-info">
            <div className="sdk-hero-tags">
              <span className="sdk-badge-deity">本尊：{entry.deityFocus}</span>
              <span className="sdk-badge-source">
                CBETA: {entry.sourceMeta.cbetaXmlId} ({entry.sourceMeta.ancientTranslator})
              </span>
              {entry.sourceMeta.gretilId && (
                <span className="sdk-badge-gretil">
                  GRETIL 梵本: {entry.sourceMeta.gretilId}
                </span>
              )}
            </div>

            <h2 className="sdk-hero-title-zh">{entry.titleZh}</h2>
            <div className="sdk-hero-title-sa">
              <span className="siddham-text">{entry.titleSaSiddham}</span>
              <span className="deva-text">{entry.titleSaDeva}</span>
              <span className="iast-text">{entry.titleSaIast}</span>
            </div>
            <p className="sdk-hero-summary">{entry.summaryZh}</p>
            <div className="sdk-hero-benefits">
              <strong>功德利益：</strong>
              {entry.ritualBenefitsZh}
            </div>
          </div>
        </div>

        {/* 操作与权威源文件核验工具条 */}
        <div className="sdk-hero-toolbar">
          <div className="sdk-audio-controls">
            <button
              type="button"
              onClick={handleChantEntireDharani}
              className={`sdk-btn-primary ${isChantingAll ? 'active' : ''}`}
            >
              {isChantingAll ? <Square size={15} /> : <Volume2 size={16} />}
              <span>{isChantingAll ? '停止全咒吟诵' : '全咒连续梵音吟诵'}</span>
            </button>

            <label className="sdk-select-pill">
              <span>音源引擎：</span>
              <select
                value={audioMode}
                onChange={e => setAudioMode(e.target.value as AudioEngineMode)}
              >
                <option value="auto">智能双轨 (TTS + 136.1Hz共振峰兜底)</option>
                <option value="synth">136.1Hz 梵音共振峰禅诵合成器</option>
                <option value="tts">浏览器梵语/印地语 TTS</option>
              </select>
            </label>

            <label className="sdk-select-pill">
              <span>持诵语速：</span>
              <select
                value={speechRate}
                onChange={e => setSpeechRate(parseFloat(e.target.value))}
              >
                <option value={0.6}>0.6x 慢速拆解教学</option>
                <option value={0.82}>0.8x 标准庄严持诵</option>
                <option value={1.0}>1.0x 原速流利念诵</option>
              </select>
            </label>
          </div>

          <div className="sdk-view-switches">
            {cbetaTtRecord && (
              <div className="sdk-segmented-switch">
                <button
                  type="button"
                  onClick={() => setViewMode('verses')}
                  className={viewMode === 'verses' ? 'active' : ''}
                >
                  <BookOpen size={14} />
                  十维分段精解 ({entry.verses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cbeta-tt')}
                  className={viewMode === 'cbeta-tt' ? 'active' : ''}
                >
                  <Table2 size={14} />
                  CBETA 唐代悉昙逐字对音 ({cbetaTtRecord.ttPairCount}字)
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSourceModal(true)}
              className="sdk-btn-outline"
            >
              <ShieldCheck size={15} />
              查看权威原典源文件
            </button>

            <button
              type="button"
              onClick={onToggleFavorite}
              className={`sdk-btn-outline ${isFavorite ? 'fav-active' : ''}`}
            >
              <Star size={15} fill={isFavorite ? 'currentColor' : 'none'} />
              {isFavorite ? '已收藏' : '收藏本咒'}
            </button>
          </div>
        </div>

        {/* 10 维显示层级自由开关面板 */}
        {viewMode === 'verses' && (
          <div className="sdk-layer-toggles-bar">
            <span className="sdk-layer-toggles-title">
              <Sliders size={13} />
              十维显示层级控制：
            </span>
            <div className="sdk-layer-chips">
              {layerToggles.map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggleLayer(item.key)}
                  className={`sdk-layer-chip ${layers[item.key] ? 'on' : 'off'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 主体内容区：十维分段精解 或 CBETA 唐代悉昙对音矩阵 */}
      {viewMode === 'cbeta-tt' && cbetaTtRecord ? (
        <CbetaSiddhamInterlinearView
          record={cbetaTtRecord}
          audioMode={audioMode}
          speechRate={speechRate}
        />
      ) : (
        <div className="sdk-verses-list">
          {entry.verses.map(verse => (
            <VerseBlock
              key={verse.id}
              verse={verse}
              layers={layers}
              audioMode={audioMode}
              speechRate={speechRate}
            />
          ))}
        </div>
      )}

      {showSourceModal && (
        <AuthoritativeSourceModal
          entry={entry}
          onClose={() => setShowSourceModal(false)}
        />
      )}
    </div>
  );
};
