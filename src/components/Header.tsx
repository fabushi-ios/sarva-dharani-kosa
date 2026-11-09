/**
 * Top Navigation & Plan 1 / Plan 3 Neural Audio Status Header (`src/components/Header.tsx`)
 */

import React from 'react';
import {
  ActiveAppView,
  AudioEngineMode,
  AudioHealthStatus,
  NeuralVoice,
} from '../types/dharani';

interface HeaderProps {
  activeView: ActiveAppView;
  onSelectView: (view: ActiveAppView) => void;
  audioMode: AudioEngineMode;
  onChangeAudioMode: (mode: AudioEngineMode) => void;
  voice: NeuralVoice;
  onChangeVoice: (voice: NeuralVoice) => void;
  healthStatus: AudioHealthStatus;
}

const NAV_ITEMS: Array<{ id: ActiveAppView; label: string; subtitle: string }> = [
  { id: 'reader', label: '📖 陀罗尼宝典阅览', subtitle: '10-Layer Dhāraṇī Reader' },
  { id: 'academy', label: '🎓 悉昙声韵学院', subtitle: '34×14 Phonetics Academy' },
  { id: 'engine-v3', label: '⚡ 梵音全覆盖引擎 v3.0', subtitle: 'Phonetic Engine v3.0' },
  { id: 'cbeta-taisho', label: '📜 CBETA 悉昙对勘 & 密教部', subtitle: 'CBETA / Taishō / GRETIL' },
  { id: 'compiler', label: '🛠️ 自定义真言编译器', subtitle: 'Custom Dhāraṇī Compiler' },
];

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  audioMode,
  onChangeAudioMode,
  voice,
  onChangeVoice,
  healthStatus,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-amber-900/40 bg-stone-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-red-900/30 text-2xl font-bold text-amber-300 shadow-inner">
            <span className="font-siddham">𑖀</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-cn text-lg font-bold tracking-wide text-amber-200 sm:text-xl">
                梵音宝典 · Sarva-Dhāraṇī-Kośa
              </h1>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-950/70 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
                v3.0 Plan 1 + Plan 3 48kHz Neural
              </span>
            </div>
            <p className="text-xs text-stone-400">
              CBETA TEI-P5 悉昙原典 · 哥廷根 GRETIL 梵文贝叶经 · IIT Madras 48kHz 原生梵文神经网络发音
            </p>
          </div>
        </div>

        {/* Plan 1 Live Neural Status & Quick Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            id="kosaAudioStatusBadge"
            className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/90 px-3 py-1.5 text-xs"
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                healthStatus.backendOnline
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-amber-400'
              }`}
            />
            <span className="text-stone-300">
              方案 1 <strong className="text-amber-300">Ninada VITS 48kHz 梵文神经引擎</strong>
            </span>
          </div>

          <select
            aria-label="选择梵音合成模式"
            value={audioMode}
            onChange={(e) => onChangeAudioMode(e.target.value as AudioEngineMode)}
            className="rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-amber-200 focus:border-amber-500 focus:outline-none"
          >
            <option value="neural-tts">方案 1：IIT Madras 原生梵文神经网络 (48kHz VITS)</option>
            <option value="legacy-tts">系统浏览器语音兜底 (Legacy Web Speech)</option>
          </select>

          <select
            aria-label="选择梵音神经网络声线"
            value={voice}
            onChange={(e) => onChangeVoice(e.target.value as NeuralVoice)}
            className="rounded-lg border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-200 focus:border-amber-500 focus:outline-none"
          >
            <option value="male">Studio 男声学者 (sa.onnx 48kHz)</option>
            <option value="female">Studio 女声学者 (sa_female.onnx 48kHz)</option>
            <option value="mobile">高速轻量男声 (onnx_mobile 48kHz)</option>
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="border-t border-stone-800/80 bg-stone-900/60 px-4">
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto py-1.5">
          {NAV_ITEMS.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                  active
                    ? 'border border-amber-500/50 bg-amber-500/15 text-amber-200 shadow-sm'
                    : 'border border-transparent text-stone-400 hover:bg-stone-800/70 hover:text-stone-200'
                }`}
              >
                <span>{item.label}</span>
                <span className="hidden text-[10px] opacity-65 xl:inline">({item.subtitle})</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

export default Header;
