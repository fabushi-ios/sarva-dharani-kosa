import React, { useState, useMemo } from 'react';
import { Eye, Layers, Sparkles, SlidersHorizontal, BookOpenCheck } from 'lucide-react';
import type { ScriptVisibilityConfig } from '../../types/kosaTypes';

interface ScriptControlBarProps {
  config: ScriptVisibilityConfig;
  onChange: (updated: ScriptVisibilityConfig) => void;
  hasSiddhamInterlinear: boolean;
  interlinearCount: number;
  readerSubMode: 'verses' | 'cbeta-interlinear';
  onReaderSubModeChange: (mode: 'verses' | 'cbeta-interlinear') => void;
}

const TOGGLE_ITEMS: { key: keyof ScriptVisibilityConfig; label: string }[] = [
  { key: 'showFullCombinedSummary', label: '全咒汇总 (六体)' },
  { key: 'showSiddham', label: '悉昙梵字' },
  { key: 'showDevanagari', label: '天城体' },
  { key: 'showIast', label: 'IAST 转写' },
  { key: 'showModernPhoneticZh', label: '梵音拼读' },
  { key: 'showPhoneticIastBracket', label: '拼读附(IAST)' },
  { key: 'showClassicalZh', label: '古汉语音译' },
  { key: 'showIpa', label: 'IPA 音标' },
  { key: 'showProsodyMeter', label: '轻重律音节' },
  { key: 'showMeaningZh', label: '汉文意译' },
  { key: 'showMeaningEn', label: 'English Gloss' },
  { key: 'showWordGloss', label: '逐词词根解析' },
];

type ReadingPresetId = 'chanting' | 'standard' | 'scholarly';

const PRESET_CONFIGS: Record<ReadingPresetId, Omit<ScriptVisibilityConfig, 'hideDerivedReference'>> = {
  chanting: {
    showFullCombinedSummary: true,
    showSiddham: true,
    showDevanagari: false,
    showIast: true,
    showModernPhoneticZh: true,
    showPhoneticIastBracket: false,
    showClassicalZh: true,
    showIpa: false,
    showProsodyMeter: false,
    showMeaningZh: true,
    showMeaningEn: false,
    showWordGloss: false,
  },
  standard: {
    showFullCombinedSummary: true,
    showSiddham: true,
    showDevanagari: true,
    showIast: true,
    showModernPhoneticZh: true,
    showPhoneticIastBracket: false,
    showClassicalZh: true,
    showIpa: false,
    showProsodyMeter: true,
    showMeaningZh: true,
    showMeaningEn: false,
    showWordGloss: false,
  },
  scholarly: {
    showFullCombinedSummary: true,
    showSiddham: true,
    showDevanagari: true,
    showIast: true,
    showModernPhoneticZh: true,
    showPhoneticIastBracket: true,
    showClassicalZh: true,
    showIpa: true,
    showProsodyMeter: true,
    showMeaningZh: true,
    showMeaningEn: true,
    showWordGloss: true,
  },
};

export const ScriptControlBar: React.FC<ScriptControlBarProps> = ({
  config,
  onChange,
  hasSiddhamInterlinear,
  interlinearCount,
  readerSubMode,
  onReaderSubModeChange,
}) => {
  const [mobileLayersOpen, setMobileLayersOpen] = useState(false);

  const toggleKey = (key: keyof ScriptVisibilityConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  const applyPreset = (presetId: ReadingPresetId) => {
    onChange({
      ...PRESET_CONFIGS[presetId],
      hideDerivedReference: config.hideDerivedReference,
    });
  };

  const activePreset = useMemo<ReadingPresetId | null>(() => {
    for (const id of ['chanting', 'standard', 'scholarly'] as const) {
      const target = PRESET_CONFIGS[id];
      const matches = (Object.keys(target) as Array<keyof typeof target>).every(
        (k) => Boolean(config[k]) === Boolean(target[k])
      );
      if (matches) return id;
    }
    return null;
  }, [config]);

  const enabledLayerCount = useMemo(
    () => TOGGLE_ITEMS.filter((item) => Boolean(config[item.key])).length,
    [config]
  );

  return (
    <div className="script-control-bar">
      <div className="script-bar-top-row">
        <div className="preset-pills-group" role="group" aria-label="一键阅读视图预设">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.28rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-secondary)',
            }}
          >
            <BookOpenCheck size={14} />
            <span>阅读视图：</span>
          </span>

          <button
            type="button"
            className={`preset-mode-pill ${activePreset === 'chanting' ? 'active' : ''}`}
            onClick={() => applyPreset('chanting')}
            title="精简专注视图：悉昙 + IAST + 梵音拼读 + 古汉语音译 + 汉文意译"
          >
            持诵专注
          </button>
          <button
            type="button"
            className={`preset-mode-pill ${activePreset === 'standard' ? 'active' : ''}`}
            onClick={() => applyPreset('standard')}
            title="标准修学视图：四体梵文 + 拼读/古音 + 轻重音律点读"
          >
            标准对照
          </button>
          <button
            type="button"
            className={`preset-mode-pill ${activePreset === 'scholarly' ? 'active' : ''}`}
            onClick={() => applyPreset('scholarly')}
            title="学术全览视图：开启全部 12 项转写、国际音标与逐词词根语法解析"
          >
            学术全览
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="mobile-layer-drawer-btn"
            onClick={() => setMobileLayersOpen((v) => !v)}
          >
            <SlidersHorizontal size={13} />
            <span>
              {mobileLayersOpen
                ? '收起层级开关'
                : `自定义层级 (${enabledLayerCount}/${TOGGLE_ITEMS.length})`}
            </span>
          </button>

          {hasSiddhamInterlinear && (
            <div className="reader-mode-switch">
              <button
                id="reader-submode-verses"
                type="button"
                className={`reader-mode-btn ${readerSubMode === 'verses' ? 'active' : ''}`}
                onClick={() => onReaderSubModeChange('verses')}
              >
                <Layers size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                多体对照解析
              </button>
              <button
                id="reader-submode-cbeta-interlinear"
                type="button"
                className={`reader-mode-btn ${readerSubMode === 'cbeta-interlinear' ? 'active' : ''}`}
                onClick={() => onReaderSubModeChange('cbeta-interlinear')}
              >
                <Sparkles size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
                CBETA 悉昙对音 ({interlinearCount}字)
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={`script-toggles-wrap ${mobileLayersOpen ? 'is-mobile-open' : ''}`}
        role="group"
        aria-label="多体文字与注音显示开关"
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.28rem',
            fontSize: '0.74rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginRight: '0.15rem',
          }}
        >
          <Eye size={13} />
          <span>细分开关：</span>
        </span>
        {TOGGLE_ITEMS.map((item) => (
          <button
            key={item.key}
            id={`toggle-script-${item.key}`}
            type="button"
            className={`script-toggle-pill ${config[item.key] ? 'on' : ''}`}
            onClick={() => toggleKey(item.key)}
          >
            <span>{item.label}</span>
          </button>
        ))}

        <button
          id="toggle-script-hideDerivedReference"
          type="button"
          className={`script-toggle-pill ${config.hideDerivedReference ? 'on' : ''}`}
          style={
            config.hideDerivedReference
              ? {
                  background: 'var(--accent-vermilion)',
                  borderColor: 'var(--accent-vermilion)',
                  color: '#fff8ee',
                  fontWeight: 700,
                }
              : {
                  borderStyle: 'dashed',
                  borderColor: 'var(--accent-vermilion-border)',
                  color: 'var(--accent-vermilion)',
                  fontWeight: 600,
                }
          }
          onClick={() => toggleKey('hideDerivedReference')}
          title="开启后仅显示原数据库固有内容，自动隐藏所有系统处理推导的参考项"
        >
          <span>
            {config.hideDerivedReference ? '● 仅看库藏原文（已开）' : '仅看库藏原文'}
          </span>
        </button>
      </div>
    </div>
  );
};
