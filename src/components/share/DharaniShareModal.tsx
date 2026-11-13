import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  QrCode,
  Smartphone,
  Sparkles,
  Grid,
  AlignLeft,
  Link2,
  Loader2,
} from 'lucide-react';
import '../../styles/shareModal.css';
import type { DharaniEntry, ScriptVisibilityConfig } from '../../types/kosaTypes';
import type {
  AudioEngineMode,
  PlaybackState,
} from '../../services/audio/sanskritAudioEngine';
import {
  buildDharaniShareUrl,
  getDefaultShareBaseUrl,
} from '../../core/share/shareUrlCodec';
import {
  extractEntrySiddhamBlocks,
  renderDharaniSharePoster,
  type PosterAspectRatio,
  type PosterLayerSelection,
  type PosterLayoutStyle,
  type PosterThemeId,
  type RenderedSharePoster,
} from '../../services/share/sharePosterRenderer';
import { iastToSiddham } from '../../core/sanskrit/transliterator';
import { PhoneticText } from '../common/PhoneticText';

export interface DharaniShareModalProps {
  entry: DharaniEntry;
  scriptConfig: ScriptVisibilityConfig;
  playbackState: PlaybackState;
  initialVerseIndex?: number | null;
  theme: 'light' | 'dark';
  onClose: () => void;
}

const MODE_LABELS_ZH: Record<AudioEngineMode, string> = {
  'neural-vits-48k': '48kHz 神经VITS',
  'neural-resonance-hall': '48kHz 神经·殿堂共鸣',
  'neural-vedic-chant': '48kHz 神经·定调梵呗',
  'studio-vocal-chant': '136.1Hz 共振峰合成',
  'mandarin-phonetic-guide': '现代梵音领诵',
  'indic-devanagari-tts': '天城文语音',
};

const LAYER_OPTIONS: Array<{ key: keyof PosterLayerSelection; label: string }> = [
  { key: 'showSiddham', label: '悉昙梵字' },
  { key: 'showModernPhoneticZh', label: '梵音拼读' },
  { key: 'showPhoneticIastBracket', label: '拼读附 (IAST)' },
  { key: 'showIast', label: '梵文 IAST' },
  { key: 'showDevanagari', label: '天城梵文' },
  { key: 'showClassicalZh', label: '古汉语音译' },
  { key: 'showMeaningZh', label: '汉文意译' },
  { key: 'showMeaningEn', label: 'English 意译' },
  { key: 'showIpa', label: 'IPA 国际音标' },
  { key: 'showBijaSeal', label: '本尊种子字印' },
  { key: 'showHeaderMeta', label: '经号与本尊标签' },
];

export const DharaniShareModal: React.FC<DharaniShareModalProps> = ({
  entry,
  scriptConfig,
  playbackState,
  initialVerseIndex = null,
  theme,
  onClose,
}) => {
  const [mobilePane, setMobilePane] = useState<'controls' | 'preview'>('preview');
  const [ratio, setRatio] = useState<PosterAspectRatio>('9:16');
  const [posterTheme, setPosterTheme] = useState<PosterThemeId>(
    theme === 'dark' ? 'sutra-dark' : 'xuan-light'
  );
  const [layoutStyle, setLayoutStyle] = useState<PosterLayoutStyle>('verse-rows');

  const [layers, setLayers] = useState<PosterLayerSelection>(() => {
    const anyMain =
      scriptConfig.showSiddham ||
      scriptConfig.showModernPhoneticZh ||
      scriptConfig.showIast ||
      scriptConfig.showDevanagari ||
      scriptConfig.showClassicalZh;
    return {
      showSiddham: anyMain ? scriptConfig.showSiddham : true,
      showModernPhoneticZh: anyMain ? scriptConfig.showModernPhoneticZh : true,
      showPhoneticIastBracket: scriptConfig.showPhoneticIastBracket,
      showIast: anyMain ? scriptConfig.showIast : true,
      showDevanagari: scriptConfig.showDevanagari,
      showClassicalZh: scriptConfig.showClassicalZh,
      showMeaningZh: scriptConfig.showMeaningZh,
      showMeaningEn: false,
      showIpa: false,
      showBijaSeal: true,
      showHeaderMeta: true,
    };
  });

  // Initialize selected verses: single verse if launched from a VerseBlock, otherwise smart default
  const [selectedVerseSet, setSelectedVerseSet] = useState<Set<number>>(() => {
    if (
      typeof initialVerseIndex === 'number' &&
      initialVerseIndex >= 0 &&
      initialVerseIndex < entry.verses.length
    ) {
      return new Set([initialVerseIndex]);
    }
    const defaultCount = Math.min(entry.verses.length, entry.verses.length <= 6 ? entry.verses.length : 4);
    return new Set(Array.from({ length: defaultCount }, (_, i) => i));
  });

  const sortedVerseIndices = useMemo(
    () => Array.from(selectedVerseSet).sort((a, b) => a - b),
    [selectedVerseSet]
  );

  // Extract individual Siddham orthographic blocks for all selected verses
  const allBlocks = useMemo(
    () =>
      extractEntrySiddhamBlocks(
        entry,
        sortedVerseIndices,
        layers.showPhoneticIastBracket
      ),
    [entry, sortedVerseIndices, layers.showPhoneticIastBracket]
  );

  // `null` means all extracted blocks in selected verses are active; otherwise explicit subset
  const [customBlockSet, setCustomBlockSet] = useState<Set<string> | null>(null);
  const [showBlockPicker, setShowBlockPicker] = useState<boolean>(true);

  // Reset block subset if verse selection changes and invalidates IDs
  useEffect(() => {
    setCustomBlockSet((prev) => {
      if (!prev) return null;
      const validIds = new Set(allBlocks.map((b) => b.id));
      const kept = Array.from(prev).filter((id) => validIds.has(id));
      return kept.length === 0 || kept.length === allBlocks.length ? null : new Set(kept);
    });
  }, [allBlocks]);

  const [baseUrlInput, setBaseUrlInput] = useState<string>(() => getDefaultShareBaseUrl());
  const [autoListenOnScan, setAutoListenOnScan] = useState<boolean>(true);

  const qrUrl = useMemo(() => {
    const firstVerse = sortedVerseIndices.length > 0 ? sortedVerseIndices[0] : 0;
    const isSingleVerse = sortedVerseIndices.length === 1 && entry.verses.length > 1;
    return buildDharaniShareUrl({
      baseUrl: baseUrlInput,
      entry,
      listen: autoListenOnScan,
      startVerseIndex: firstVerse,
      singleVerse: isSingleVerse,
      voice: playbackState.voice,
      mode: playbackState.mode,
    });
  }, [
    baseUrlInput,
    entry,
    autoListenOnScan,
    sortedVerseIndices,
    playbackState.voice,
    playbackState.mode,
  ]);

  const [renderedPoster, setRenderedPoster] = useState<RenderedSharePoster | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copiedAction, setCopiedAction] = useState<'image' | 'link' | null>(null);

  const canNativeShare = useMemo(() => {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Debounced live poster rendering
  useEffect(() => {
    if (sortedVerseIndices.length === 0) {
      setRenderedPoster(null);
      setIsRendering(false);
      return;
    }

    let cancelled = false;
    setIsRendering(true);
    setRenderError(null);

    const timer = window.setTimeout(() => {
      renderDharaniSharePoster({
        entry,
        selectedVerseIndices: sortedVerseIndices,
        selectedBlockIds: customBlockSet,
        allBlocks,
        layers,
        ratio,
        theme: posterTheme,
        layoutStyle,
        qrUrl,
        voiceLabelZh: playbackState.voice === 'female' ? '古典女声' : '古典男声',
        modeLabelZh: MODE_LABELS_ZH[playbackState.mode] || '48kHz 神经VITS',
      })
        .then((res) => {
          if (!cancelled) {
            setRenderedPoster(res);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setRenderError(err instanceof Error ? err.message : String(err));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsRendering(false);
          }
        });
    }, 90);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    entry,
    sortedVerseIndices,
    customBlockSet,
    allBlocks,
    layers,
    ratio,
    posterTheme,
    layoutStyle,
    qrUrl,
    playbackState.voice,
    playbackState.mode,
  ]);

  const toggleLayer = (key: keyof PosterLayerSelection) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyLayerPreset = (preset: 'core3' | 'siddham-only' | 'chanting' | 'sync-reader') => {
    if (preset === 'core3') {
      setLayers((p) => ({
        ...p,
        showSiddham: true,
        showModernPhoneticZh: true,
        showIast: true,
        showDevanagari: false,
        showClassicalZh: false,
        showMeaningZh: false,
        showMeaningEn: false,
        showIpa: false,
      }));
    } else if (preset === 'siddham-only') {
      setLayers((p) => ({
        ...p,
        showSiddham: true,
        showModernPhoneticZh: false,
        showIast: false,
        showDevanagari: false,
        showClassicalZh: false,
        showMeaningZh: false,
        showMeaningEn: false,
        showIpa: false,
      }));
    } else if (preset === 'chanting') {
      setLayers((p) => ({
        ...p,
        showSiddham: true,
        showModernPhoneticZh: true,
        showIast: true,
        showDevanagari: false,
        showClassicalZh: true,
        showMeaningZh: true,
        showMeaningEn: false,
        showIpa: false,
      }));
    } else {
      setLayers((p) => ({
        ...p,
        showSiddham: scriptConfig.showSiddham,
        showModernPhoneticZh: scriptConfig.showModernPhoneticZh,
        showPhoneticIastBracket: scriptConfig.showPhoneticIastBracket,
        showIast: scriptConfig.showIast,
        showDevanagari: scriptConfig.showDevanagari,
        showClassicalZh: scriptConfig.showClassicalZh,
        showMeaningZh: scriptConfig.showMeaningZh,
        showMeaningEn: scriptConfig.showMeaningEn,
        showIpa: scriptConfig.showIpa,
      }));
    }
  };

  const toggleVerse = (idx: number) => {
    setSelectedVerseSet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        if (next.size > 1) next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleSingleBlock = (blockId: string) => {
    setCustomBlockSet((prev) => {
      const base = prev ? new Set(prev) : new Set(allBlocks.map((b) => b.id));
      if (base.has(blockId)) {
        if (base.size > 1) {
          base.delete(blockId);
        }
      } else {
        base.add(blockId);
      }
      return base.size === allBlocks.length ? null : base;
    });
  };

  const handleDownloadPng = () => {
    if (!renderedPoster) return;
    const a = document.createElement('a');
    a.href = renderedPoster.dataUrl;
    a.download = renderedPoster.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    if (!renderedPoster) return;
    try {
      const pngFile = new File([renderedPoster.blob], renderedPoster.fileName, {
        type: 'image/png',
      });
      if (navigator.canShare && navigator.canShare({ files: [pngFile] })) {
        await navigator.share({
          files: [pngFile],
          title: `${entry.titleZh} · 梵音分享卡`,
          text: `扫码聆听《${entry.titleZh}》48kHz 古典梵语持诵`,
        });
        return;
      }
      await navigator.share({
        title: `${entry.titleZh} · 梵音宝典`,
        text: `点击聆听《${entry.titleZh}》48kHz 古典梵语持诵`,
        url: qrUrl,
      });
    } catch {
      // Fallback to direct download if user cancels or WebView blocks file share
      handleDownloadPng();
    }
  };

  const handleCopyImage = async () => {
    if (!renderedPoster || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      handleDownloadPng();
      return;
    }
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': renderedPoster.blob }),
      ]);
      setCopiedAction('image');
      window.setTimeout(() => setCopiedAction(null), 2000);
    } catch {
      handleDownloadPng();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(qrUrl);
    setCopiedAction('link');
    window.setTimeout(() => setCopiedAction(null), 2000);
  };

  const activeBlockCount = customBlockSet ? customBlockSet.size : allBlocks.length;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card share-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <QrCode size={20} color="var(--accent-vermilion)" />
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              生成手机分享海报（含扫码聆听音频）· {entry.titleZh}
            </h3>
          </div>
          <button
            id="close-share-modal-btn"
            type="button"
            className="btn-scholarly"
            onClick={onClose}
          >
            <X size={16} />
            <span>关闭</span>
          </button>
        </div>

        {/* Mobile Segmented View Switcher */}
        <div className="share-mobile-tab-bar">
          <button
            type="button"
            className={`share-mobile-tab-btn ${mobilePane === 'preview' ? 'active' : ''}`}
            onClick={() => setMobilePane('preview')}
          >
            <Smartphone size={14} />
            <span>海报预览与分享</span>
          </button>
          <button
            type="button"
            className={`share-mobile-tab-btn ${mobilePane === 'controls' ? 'active' : ''}`}
            onClick={() => setMobilePane('controls')}
          >
            <Sparkles size={14} />
            <span>选悉昙字块与拼读组合</span>
          </button>
        </div>

        <div className="share-modal-grid">
          {/* Left Controls Column */}
          <div
            className={`share-controls-pane ${
              mobilePane === 'preview' ? 'is-hidden-mobile' : ''
            }`}
          >
            {/* 1. Mobile Aspect Ratio, Theme & Block Layout */}
            <div className="share-section-box">
              <div className="share-section-head">
                <span className="share-section-title">
                  <Smartphone size={15} color="var(--accent-vermilion)" />
                  <span>1. 手机图片比例、配色与版式</span>
                </span>
                <span className="share-section-hint">高清 1080p 竖版海报</span>
              </div>

              <div className="share-option-pills">
                <button
                  type="button"
                  className={`script-toggle-chip ${ratio === '9:16' ? 'active' : ''}`}
                  onClick={() => setRatio('9:16')}
                >
                  9:16 标准手机竖屏 (1080×1920)
                </button>
                <button
                  type="button"
                  className={`script-toggle-chip ${ratio === '3:4' ? 'active' : ''}`}
                  onClick={() => setRatio('3:4')}
                >
                  3:4 社交图文比例 (1080×1440)
                </button>
                <button
                  type="button"
                  className={`script-toggle-chip ${ratio === '9:16-long' ? 'active' : ''}`}
                  onClick={() => setRatio('9:16-long')}
                >
                  9:16 手机自适应长图 (全句展开)
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'space-between' }}>
                <div className="share-option-pills">
                  <button
                    type="button"
                    className={`preset-mode-pill ${posterTheme === 'xuan-light' ? 'active' : ''}`}
                    onClick={() => setPosterTheme('xuan-light')}
                  >
                    宣纸朱印（浅色）
                  </button>
                  <button
                    type="button"
                    className={`preset-mode-pill ${posterTheme === 'sutra-dark' ? 'active' : ''}`}
                    onClick={() => setPosterTheme('sutra-dark')}
                  >
                    紫金写经（深色）
                  </button>
                </div>

                <div className="share-option-pills">
                  <button
                    type="button"
                    className={`preset-mode-pill ${layoutStyle === 'verse-rows' ? 'active' : ''}`}
                    onClick={() => setLayoutStyle('verse-rows')}
                    title="按句纵向排列所选文种与注音层"
                  >
                    <AlignLeft size={13} />
                    <span>逐句对照排版</span>
                  </button>
                  <button
                    type="button"
                    className={`preset-mode-pill ${layoutStyle === 'siddham-blocks' ? 'active' : ''}`}
                    onClick={() => setLayoutStyle('siddham-blocks')}
                    title="将每一块勾选的悉昙字与拼读/IAST 排成方格字帖"
                  >
                    <Grid size={13} />
                    <span>悉昙字块方格帖</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Arbitrary Script & Phonetic Layer Combination */}
            <div className="share-section-box">
              <div className="share-section-head">
                <span className="share-section-title">
                  <Sparkles size={15} color="var(--accent-gold)" />
                  <span>2. 自由组合图片显示内容（可任意多选）</span>
                </span>
                <div className="share-option-pills">
                  <button
                    type="button"
                    className="btn-scholarly"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.71rem' }}
                    onClick={() => applyLayerPreset('core3')}
                  >
                    悉昙+拼读+IAST
                  </button>
                  <button
                    type="button"
                    className="btn-scholarly"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.71rem' }}
                    onClick={() => applyLayerPreset('siddham-only')}
                  >
                    仅悉昙字
                  </button>
                  <button
                    type="button"
                    className="btn-scholarly"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.71rem' }}
                    onClick={() => applyLayerPreset('chanting')}
                  >
                    助读全套
                  </button>
                  <button
                    type="button"
                    className="btn-scholarly"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.71rem' }}
                    onClick={() => applyLayerPreset('sync-reader')}
                  >
                    同步阅读页
                  </button>
                </div>
              </div>

              <div className="share-layer-grid">
                {LAYER_OPTIONS.map((item) => {
                  const isOn = layers[item.key];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`share-layer-check ${isOn ? 'checked' : ''}`}
                      onClick={() => toggleLayer(item.key)}
                    >
                      <span className="share-check-box">{isOn ? '✓' : ''}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Verse Selection */}
            <div className="share-section-box">
              <div className="share-section-head">
                <span className="share-section-title">
                  <span>
                    3. 选择句段（已选 {sortedVerseIndices.length} / {entry.verses.length} 句）
                  </span>
                </span>
                <div className="share-option-pills">
                  <button
                    type="button"
                    className="btn-scholarly"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.71rem' }}
                    onClick={() => {
                      setSelectedVerseSet(new Set([0]));
                      setCustomBlockSet(null);
                    }}
                  >
                    仅首句
                  </button>
                  {entry.verses.length > 3 && (
                    <button
                      type="button"
                      className="btn-scholarly"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.71rem' }}
                      onClick={() => {
                        setSelectedVerseSet(new Set([0, 1, 2]));
                        setCustomBlockSet(null);
                      }}
                    >
                      前 3 句
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-scholarly gold"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.71rem' }}
                    onClick={() => {
                      setSelectedVerseSet(
                        new Set(Array.from({ length: entry.verses.length }, (_, i) => i))
                      );
                      setCustomBlockSet(null);
                      if (entry.verses.length > 6 && ratio !== '9:16-long') {
                        setRatio('9:16-long');
                      }
                    }}
                  >
                    全选 ({entry.verses.length}句)
                  </button>
                </div>
              </div>

              <div className="share-verse-list">
                {entry.verses.map((v, idx) => {
                  const checked = selectedVerseSet.has(idx);
                  const previewSid = v.siddhamOriginal?.trim() || iastToSiddham(v.iast);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={`share-verse-row ${checked ? 'checked' : ''}`}
                      onClick={() => toggleVerse(idx)}
                    >
                      <span className="share-check-box">{checked ? '✓' : ''}</span>
                      <span className="share-verse-num">
                        第{String(v.index).padStart(2, '0')}句
                      </span>
                      <span className="share-verse-preview">
                        <span className="share-verse-sid">{previewSid.slice(0, 14)}</span>
                        <span className="share-verse-iast">{v.iast}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Granular Per-Block Siddham Selector */}
            {allBlocks.length > 0 && (
              <div className="share-section-box">
                <div className="share-section-head">
                  <span className="share-section-title">
                    <span>
                      4. 逐块点选悉昙字块（已选 {activeBlockCount} / {allBlocks.length} 块）
                    </span>
                  </span>
                  <div className="share-option-pills">
                    <button
                      type="button"
                      className="btn-scholarly"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.71rem' }}
                      onClick={() => setCustomBlockSet(null)}
                    >
                      全选字块
                    </button>
                    <button
                      type="button"
                      className="btn-scholarly"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.71rem' }}
                      onClick={() =>
                        allBlocks[0] && setCustomBlockSet(new Set([allBlocks[0].id]))
                      }
                    >
                      仅留首块
                    </button>
                    <button
                      type="button"
                      className="btn-scholarly"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.71rem' }}
                      onClick={() => setShowBlockPicker((v) => !v)}
                    >
                      {showBlockPicker ? '收起字块面板' : '展开逐块选择'}
                    </button>
                  </div>
                </div>

                {showBlockPicker && (
                  <div className="share-siddham-grid">
                    {allBlocks.map((blk) => {
                      const isSelected = customBlockSet
                        ? customBlockSet.has(blk.id)
                        : true;
                      return (
                        <button
                          key={blk.id}
                          type="button"
                          className={`share-siddham-chip ${isSelected ? 'checked' : ''}`}
                          onClick={() => toggleSingleBlock(blk.id)}
                          title={`点击勾选或取消该字块：${blk.iast}`}
                        >
                          <span className="share-check-box">{isSelected ? '✓' : ''}</span>
                          <span className="share-chip-sid">{blk.siddham}</span>
                          <span className="share-chip-phon">
                            <PhoneticText text={blk.modernZh} />
                          </span>
                          <span className="share-chip-iast">{blk.iast}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 5. QR Target URL & Audio Auto-Play Configuration */}
            <div className="share-section-box">
              <div className="share-section-head">
                <span className="share-section-title">
                  <Link2 size={15} color="var(--accent-lapis)" />
                  <span>5. 二维码跳转网站与音频聆听设置</span>
                </span>
                <button
                  type="button"
                  className={`script-toggle-chip ${autoListenOnScan ? 'active' : ''}`}
                  onClick={() => setAutoListenOnScan((v) => !v)}
                >
                  {autoListenOnScan ? '✓ 扫码直达音频播放' : '仅打开经文页面'}
                </button>
              </div>

              <div className="share-url-input-row">
                <input
                  type="url"
                  className="text-input"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  placeholder="输入线上网站根地址（默认自动读取当前网址）"
                  aria-label="二维码跳转网站根域名"
                />
                <button
                  type="button"
                  className="btn-scholarly"
                  onClick={handleCopyLink}
                  title="复制二维码完整音频直达链接"
                >
                  {copiedAction === 'link' ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedAction === 'link' ? '已复制链接' : '复制链接'}</span>
                </button>
              </div>
              <div className="share-section-hint" style={{ wordBreak: 'break-all' }}>
                扫码识别地址：{qrUrl}
              </div>
            </div>
          </div>

          {/* Right Live Mobile Poster Preview & Export Actions */}
          <div
            className={`share-preview-pane ${
              mobilePane === 'controls' ? 'is-hidden-mobile' : ''
            }`}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                实时手机海报预览{' '}
                {renderedPoster ? `(${renderedPoster.width} × ${renderedPoster.height} px)` : ''}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                手机端可直接点击下方分享或长按图片保存相册
              </div>
            </div>

            <div className="share-phone-frame">
              <div className="share-poster-scroll-viewport">
                {isRendering && !renderedPoster ? (
                  <div
                    style={{
                      height: '420px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      color: '#52453a',
                      fontSize: '0.82rem',
                    }}
                  >
                    <Loader2 size={24} className="spin-icon" />
                    <span>正在排版渲染高清梵音海报...</span>
                  </div>
                ) : renderError ? (
                  <div style={{ padding: '1.5rem', color: '#9e2a2b', fontSize: '0.8rem' }}>
                    渲染失败：{renderError}
                  </div>
                ) : renderedPoster ? (
                  <img
                    src={renderedPoster.dataUrl}
                    alt={`${entry.titleZh} 梵音分享海报`}
                    className="share-poster-img"
                  />
                ) : null}
              </div>
            </div>

            {renderedPoster && renderedPoster.truncatedVerseCount > 0 && (
              <div
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--accent-gold-soft)',
                  border: '1px solid var(--accent-gold-border)',
                  fontSize: '0.73rem',
                  color: 'var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.4rem',
                }}
              >
                <span>当前单屏比例自动省略末尾 {renderedPoster.truncatedVerseCount} 项</span>
                <button
                  type="button"
                  className="btn-scholarly gold"
                  style={{ padding: '0.18rem 0.48rem', fontSize: '0.7rem' }}
                  onClick={() => setRatio('9:16-long')}
                >
                  切换手机长图全显
                </button>
              </div>
            )}

            <div className="share-preview-actions">
              {canNativeShare && (
                <button
                  id="share-poster-native-btn"
                  type="button"
                  className="btn-scholarly primary"
                  style={{ width: '100%', padding: '0.58rem 1rem', fontSize: '0.86rem' }}
                  disabled={!renderedPoster || isRendering}
                  onClick={handleNativeShare}
                >
                  <Share2 size={15} />
                  <span>一键调用手机/系统分享图片</span>
                </button>
              )}

              <div className="share-action-row">
                <button
                  id="share-poster-download-btn"
                  type="button"
                  className={`btn-scholarly ${canNativeShare ? 'gold' : 'primary'}`}
                  style={{ padding: '0.52rem 0.75rem' }}
                  disabled={!renderedPoster || isRendering}
                  onClick={handleDownloadPng}
                >
                  <Download size={15} />
                  <span>下载高清 PNG</span>
                </button>

                <button
                  id="share-poster-copy-img-btn"
                  type="button"
                  className="btn-scholarly"
                  style={{ padding: '0.52rem 0.75rem' }}
                  disabled={!renderedPoster || isRendering}
                  onClick={handleCopyImage}
                >
                  {copiedAction === 'image' ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copiedAction === 'image' ? '图片已复制' : '复制图片'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
