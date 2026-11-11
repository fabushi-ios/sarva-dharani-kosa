import React from 'react';
import { Eye, Layers, Sparkles } from 'lucide-react';
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
  { key: 'showFullCombinedSummary', label: '全咒多句汇总 (六体合一)' },
  { key: 'showSiddham', label: '悉昙梵字 (Siddhaṃ)' },
  { key: 'showDevanagari', label: '天城体 (Devanāgarī)' },
  { key: 'showIast', label: 'IAST 国际转写' },
  { key: 'showModernPhoneticZh', label: '梵音拼读' },
  { key: 'showPhoneticIastBracket', label: '拼读括号 (IAST)' },
  { key: 'showClassicalZh', label: '古汉语音译' },
  { key: 'showIpa', label: 'IPA 国际音标' },
  { key: 'showProsodyMeter', label: '轻重音律 (Guru/Laghu)' },
  { key: 'showMeaningZh', label: '汉文意译' },
  { key: 'showMeaningEn', label: 'English Gloss' },
  { key: 'showWordGloss', label: '逐词词根语法解析' },
];

export const ScriptControlBar: React.FC<ScriptControlBarProps> = ({
  config,
  onChange,
  hasSiddhamInterlinear,
  interlinearCount,
  readerSubMode,
  onReaderSubModeChange,
}) => {
  const toggleKey = (key: keyof ScriptVisibilityConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  return (
    <div className="script-control-bar">
      <div className="script-toggles-wrap" role="group" aria-label="多体文字与注音显示开关">
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.76rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginRight: '0.25rem',
          }}
        >
          <Eye size={14} />
          <span>显示层级：</span>
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
            {config.hideDerivedReference ? '● 仅看库藏原文（已隐藏参考）' : '仅看库藏原文'}
          </span>
        </button>
      </div>

      {hasSiddhamInterlinear && (
        <div className="reader-mode-switch">
          <button
            id="reader-submode-verses"
            type="button"
            className={`reader-mode-btn ${readerSubMode === 'verses' ? 'active' : ''}`}
            onClick={() => onReaderSubModeChange('verses')}
          >
            <Layers size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
            四体对照与逐词解析
          </button>
          <button
            id="reader-submode-cbeta-interlinear"
            type="button"
            className={`reader-mode-btn ${readerSubMode === 'cbeta-interlinear' ? 'active' : ''}`}
            onClick={() => onReaderSubModeChange('cbeta-interlinear')}
          >
            <Sparkles size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
            CBETA 悉昙梵汉逐字对音 ({interlinearCount}字)
          </button>
        </div>
      )}
    </div>
  );
};
