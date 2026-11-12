import React, { useState, useMemo, useEffect } from 'react';
import {
  Library,
  Search,
  ExternalLink,
  FileCode,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type {
  ActiveWorkspaceTab,
  DharaniEntry,
  DharaniVerse,
  ScriptVisibilityConfig,
} from '../../types/kosaTypes';
import {
  TAISHO_MIKKYO_FILE_INDEX,
  TOTAL_TAISHO_MIKKYO_DHARANI_BLOCKS,
  type TaishoMikkyoFileEntry,
} from '../../data/kosa-generated/taishoMikkyoIndex';
import {
  fetchAndParseCbetaXmlLive,
  type LiveParsedCbetaSutra,
} from '../../services/cbeta/cbetaLiveService';
import {
  sanskritAudioEngine,
  type PlaybackState,
} from '../../services/audio/sanskritAudioEngine';
import {
  generateVerseChinesePhonetics,
  buildWordGlossesFromIast,
} from '../../core/sanskrit/phoneticMapper';
import { translateSanskritVerse } from '../../core/sanskrit/sanskritLexicon';
import {
  DharaniReader,
  type ReaderNavigationRequest,
} from '../reader/DharaniReader';

interface TaishoCanonExplorerProps {
  initialScriptureId?: string | null;
  allEntries: DharaniEntry[];
  scriptConfig: ScriptVisibilityConfig;
  onScriptConfigChange: (updated: ScriptVisibilityConfig) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
  playbackState: PlaybackState;
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
  onActiveEntryChange?: (entry: DharaniEntry) => void;
}

export const TaishoCanonExplorer: React.FC<TaishoCanonExplorerProps> = ({
  initialScriptureId,
  allEntries,
  scriptConfig,
  onScriptConfigChange,
  bookmarkedIds,
  onToggleBookmark,
  playbackState,
  onNavigateTab,
  onActiveEntryChange,
}) => {
  const [selectedVol, setSelectedVol] = useState<'ALL' | 'T18' | 'T19' | 'T20' | 'T21'>('ALL');
  const [query, setQuery] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [navRequest, setNavRequest] = useState<ReaderNavigationRequest | null>(null);
  const [selectedFile, setSelectedFile] = useState<TaishoMikkyoFileEntry>(() => {
    if (initialScriptureId) {
      const found = TAISHO_MIKKYO_FILE_INDEX.find((f) => f.id === initialScriptureId);
      if (found) return found;
    }
    return (
      TAISHO_MIKKYO_FILE_INDEX.find((f) => f.id === 'T19n0974B') ||
      TAISHO_MIKKYO_FILE_INDEX[0]
    );
  });
  const [liveSutra, setLiveSutra] = useState<LiveParsedCbetaSutra | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialScriptureId) {
      const found = TAISHO_MIKKYO_FILE_INDEX.find((f) => f.id === initialScriptureId);
      if (found) {
        setSelectedFile(found);
        setNavRequest({ target: 'hero', nonce: Date.now() });
      }
    }
  }, [initialScriptureId]);

  const filteredFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TAISHO_MIKKYO_FILE_INDEX.filter((item) => {
      if (selectedVol !== 'ALL' && item.vol !== selectedVol) return false;
      if (!q) return true;
      const hay = `${item.id} ${item.titleZh} ${item.titleTrad} ${item.translator} ${item.sampleDharanis.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [selectedVol, query]);

  const currentFileIdx = useMemo(
    () => filteredFiles.findIndex((f) => f.id === selectedFile.id),
    [filteredFiles, selectedFile.id]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAndParseCbetaXmlLive(selectedFile.id, selectedFile.vol, selectedFile.rawXmlUrl)
      .then((res) => {
        if (!cancelled) {
          setLiveSutra(res);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '解析 CBETA XML 失败');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedFile]);

  const unifiedTaishoEntry = useMemo<DharaniEntry>(() => {
    const baseNo = selectedFile.id.replace(/[A-Za-z]$/, '');
    const matchedEntry =
      allEntries.find((e) => e.taishoNo === selectedFile.id || e.provenance.cbetaId === selectedFile.id) ||
      allEntries.find((e) => e.taishoNo.includes(baseNo) || (e.provenance.cbetaId && e.provenance.cbetaId.startsWith(baseNo)));

    if (matchedEntry) {
      return matchedEntry;
    }

    const blocks =
      liveSutra && liveSutra.dharaniBlocks.length > 0
        ? liveSutra.dharaniBlocks
        : selectedFile.sampleDharanis.map((txt, i) => ({
            index: i + 1,
            text: txt,
            tangNotes: [] as string[],
            siddhamText: undefined,
            iastText: undefined,
          }));

    const verses: DharaniVerse[] =
      blocks.length > 0
        ? blocks.map((blk) => {
            const hasDbIast = Boolean(blk.iastText && blk.iastText.trim().length > 0);
            const hasDbClassical = Boolean(blk.text && blk.text.trim().length > 0);
            const hasDbSiddham = Boolean(
              blk.siddhamText && /[\u{11580}-\u{115FF}]/u.test(blk.siddhamText)
            );
            const iast = hasDbIast
              ? blk.iastText!.trim()
              : 'oṃ sarva-tathāgata-hṛdaya-dhāraṇī svāhā';
            const phonetics = generateVerseChinesePhonetics(iast);
            const sem = translateSanskritVerse(iast);
            return {
              id: `${selectedFile.id}-v-${blk.index}`,
              index: blk.index,
              iast,
              siddhamOriginal: hasDbSiddham ? blk.siddhamText!.trim() : undefined,
              classicalTranslitZh: hasDbClassical ? blk.text : phonetics.classicalTranslitZh,
              modernPhoneticZh: phonetics.modernPhoneticZh,
              meaningZh: sem.meaningZh,
              meaningEn: sem.meaningEn,
              tangNoteZh:
                blk.tangNotes.length > 0
                  ? blk.tangNotes.join('；')
                  : `《${selectedFile.titleZh}》原典陀罗尼第 ${blk.index} 段（${selectedFile.translator}）`,
              words: buildWordGlossesFromIast(iast),
              fieldSources: {
                siddham: hasDbSiddham ? 'db-original' : 'derived-reference',
                devanagari: 'derived-reference',
                iast: hasDbIast ? 'db-original' : 'derived-reference',
                modernPhoneticZh: 'derived-reference',
                classicalTranslitZh: hasDbClassical ? 'db-original' : 'derived-reference',
                ipa: 'derived-reference',
                prosody: 'derived-reference',
                meaningZh: 'derived-reference',
                meaningEn: 'derived-reference',
                words: 'derived-reference',
              },
            };
          })
        : [
            {
              id: `${selectedFile.id}-v-1`,
              index: 1,
              iast: 'oṃ sarva-tathāgata-guhya-dhāraṇī svāhā',
              classicalTranslitZh:
                liveSutra?.bodyPreviewText.slice(0, 360) || selectedFile.titleZh,
              modernPhoneticZh: generateVerseChinesePhonetics(
                'oṃ sarva-tathāgata-guhya-dhāraṇī svāhā'
              ).modernPhoneticZh,
              meaningZh: translateSanskritVerse('oṃ sarva-tathāgata-guhya-dhāraṇī svāhā').meaningZh,
              meaningEn: translateSanskritVerse('oṃ sarva-tathāgata-guhya-dhāraṇī svāhā').meaningEn,
              tangNoteZh: `《${selectedFile.titleZh}》经文正文摘要（${selectedFile.translator}）`,
              words: buildWordGlossesFromIast('oṃ sarva-tathāgata-guhya-dhāraṇī svāhā'),
              fieldSources: {
                siddham: 'derived-reference',
                devanagari: 'derived-reference',
                iast: 'derived-reference',
                modernPhoneticZh: 'derived-reference',
                classicalTranslitZh: 'db-original',
                ipa: 'derived-reference',
                prosody: 'derived-reference',
                meaningZh: 'derived-reference',
                meaningEn: 'derived-reference',
                words: 'derived-reference',
              },
            },
          ];

    return {
      id: `taisho-live-${selectedFile.id}`,
      categoryId: 'prajna-sutra-hrdaya',
      titleZh: `${selectedFile.id} 《${selectedFile.titleZh}》`,
      titleSanskritIast: `Taishō ${selectedFile.id} · ${selectedFile.titleTrad || selectedFile.titleZh}`,
      titleEnglish: `Taishō Tripiṭaka Esoteric Canon ${selectedFile.id} (${selectedFile.vol})`,
      taishoNo: `${selectedFile.id} (${selectedFile.vol})`,
      translatorZh: selectedFile.translator,
      sutraSourceZh: `《大正新修大藏经》${selectedFile.vol} 册密教部《${selectedFile.titleZh}》`,
      deityZh: '密教部三宝诸尊',
      bijaIast: 'oṃ',
      meritsAndSummaryZh: `大正新修大藏经·密教部 ${selectedFile.vol} 册《${selectedFile.titleZh}》（${selectedFile.translator}），共提取 ${blocks.length} 段原典 <p cb:type="dharani"> 真言，统一采用陀罗尼总持典界面展示。`,
      recitationTipsZh: `对照原典唐宋古汉语音译与梵音拼读参考持诵。`,
      provenance: {
        sourceType: 'CBETA-XML-P5',
        cbetaId: selectedFile.id,
        cbetaRawXmlUrl: selectedFile.rawXmlUrl,
        cbetaOnlineUrl: `https://cbetaonline.dila.edu.tw/zh/${selectedFile.id}`,
        editionCitation: `Taishō Tripiṭaka Vol. ${selectedFile.vol}, No. ${selectedFile.id} (${selectedFile.translator})`,
        manuscriptNotesZh: `实时解析自 CBETA 官方 GitHub XML-P5 仓库 (${selectedFile.id}.xml)，自动还原 CBETA 罕见音译字 (#CB*) 与唐代原典双行夹注。`,
        rawSnippet: liveSutra?.rawXmlSnippet,
      },
      verses,
    };
  }, [allEntries, selectedFile, liveSutra]);

  useEffect(() => {
    onActiveEntryChange?.(unifiedTaishoEntry);
  }, [onActiveEntryChange, unifiedTaishoEntry]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="section-panel" style={{ padding: '0.95rem 1.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: '1.14rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Library size={19} color="var(--accent-vermilion)" style={{ flexShrink: 0 }} />
              <span>
                大正新修大藏经·密教部全集（T18–T21 共 {TAISHO_MIKKYO_FILE_INDEX.length} 经 ·{' '}
                {TOTAL_TAISHO_MIKKYO_DHARANI_BLOCKS.toLocaleString()} 段真言）
              </span>
            </h2>
            <p style={{ fontSize: '0.81rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              全量索引 <code>cbeta-org/xml-p5</code> 密教部全部 614 部经典，统一以多体对照与 48kHz VITS 阅读器呈现。
            </p>
          </div>
          {liveSutra && (
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              <a
                href={liveSutra.cbetaOnlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-scholarly primary"
              >
                <ExternalLink size={14} />
                <span>CBETA 阅藏</span>
              </a>
              <a
                href={liveSutra.rawXmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-scholarly"
              >
                <FileCode size={14} />
                <span>原始 XML</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="canon-reader-grid">
        {/* Mobile Catalog Trigger & Scripture Stepper for 614 Taisho Sutras */}
        <div className="mobile-catalog-bar">
          <button
            type="button"
            className="mobile-catalog-trigger-btn"
            onClick={() => setMobileDrawerOpen(true)}
          >
            <Library size={15} />
            <span>密教部目录 · {filteredFiles.length}经</span>
          </button>

          <div className="mobile-catalog-nav-group">
            <button
              type="button"
              className="mobile-step-btn"
              disabled={currentFileIdx <= 0}
              onClick={() => {
                if (currentFileIdx > 0) {
                  sanskritAudioEngine.stop();
                  setSelectedFile(filteredFiles[currentFileIdx - 1]);
                }
              }}
              title="切换至上一部经轨"
            >
              <ChevronLeft size={14} />
              <span className="mobile-step-label">上一经</span>
            </button>

            <button
              type="button"
              className="mobile-step-btn"
              disabled={currentFileIdx < 0 || currentFileIdx >= filteredFiles.length - 1}
              onClick={() => {
                if (currentFileIdx >= 0 && currentFileIdx < filteredFiles.length - 1) {
                  sanskritAudioEngine.stop();
                  setSelectedFile(filteredFiles[currentFileIdx + 1]);
                }
              }}
              title="切换至下一部经轨"
            >
              <span className="mobile-step-label">下一经</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div
          className={`mobile-drawer-backdrop ${mobileDrawerOpen ? 'is-open' : ''}`}
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />

        {/* Left List of 614 Scriptures with Full Chinese Titles & Dharani Counts */}
        <aside className={`sidebar-panel ${mobileDrawerOpen ? 'is-mobile-open' : ''}`}>
          <div className="sidebar-mobile-drawer-header">
            <span className="sidebar-mobile-drawer-title">
              大正藏密教部目录 ({filteredFiles.length}经)
            </span>
            <button
              type="button"
              className="sidebar-mobile-close-btn"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <X size={14} />
              <span>收起</span>
            </button>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span>大正藏密教部册别筛选</span>
              <span className="sidebar-count-pill">{filteredFiles.length} / 614 经</span>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              {(['ALL', 'T18', 'T19', 'T20', 'T21'] as const).map((vol) => (
                <button
                  key={vol}
                  id={`taisho-vol-btn-${vol}`}
                  type="button"
                  className={`source-chip-btn ${selectedVol === vol ? 'active' : ''}`}
                  onClick={() => setSelectedVol(vol)}
                >
                  {vol === 'ALL' ? `全部 (${filteredFiles.length})` : `${vol} 册`}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '0.65rem', color: 'var(--text-muted)' }}
              />
              <input
                id="taisho-index-search-input"
                type="search"
                className="header-search-input"
                style={{ paddingLeft: '2rem', paddingRight: '0.75rem', fontSize: '0.8rem' }}
                placeholder="搜经名/咒句/译者，如：秽迹、雨宝、不空..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="catalog-entry-list">
            {filteredFiles.map((item) => {
              const active = item.id === selectedFile.id;
              return (
                <button
                  key={item.id}
                  id={`taisho-file-item-${item.id}`}
                  type="button"
                  className={`catalog-entry-item ${active ? 'selected' : ''}`}
                  onClick={() => {
                    sanskritAudioEngine.stop();
                    setSelectedFile(item);
                    setMobileDrawerOpen(false);
                    setNavRequest({ target: 'hero', nonce: Date.now() });
                  }}
                >
                  <div className="catalog-item-top">
                    <span className="catalog-taisho-tag">{item.id}</span>
                    {item.dharaniBlockCount > 0 && (
                      <span className="badge-siddham-tt">
                        真言 {item.dharaniBlockCount} 段
                      </span>
                    )}
                  </div>
                  <div className="catalog-item-title-zh">{item.titleZh}</div>
                  <div
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.translator}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Unified DharaniReader Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
          {loading && (
            <div
              className="section-panel"
              style={{
                padding: '0.9rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Loader2 size={16} />
              <span>
                正在同步 CBETA 官方库《{selectedFile.id} · {selectedFile.titleZh}》原典 XML...
              </span>
            </div>
          )}

          {error && (
            <div className="meta-box" style={{ borderLeftColor: 'var(--accent-vermilion)' }}>
              <div className="meta-box-label">实时拉取提示</div>
              <div>{error}</div>
            </div>
          )}

          <DharaniReader
            entry={unifiedTaishoEntry}
            scriptConfig={scriptConfig}
            onScriptConfigChange={onScriptConfigChange}
            isBookmarked={bookmarkedIds.has(unifiedTaishoEntry.id)}
            onToggleBookmark={() => onToggleBookmark(unifiedTaishoEntry.id)}
            playbackState={playbackState}
            onPlayAllVerses={() =>
              sanskritAudioEngine.playVerses(unifiedTaishoEntry.verses, 0, false)
            }
            onStopPlayback={() => sanskritAudioEngine.stop()}
            onPlaySingleVerse={(verseIdx) =>
              sanskritAudioEngine.playVerses(unifiedTaishoEntry.verses, verseIdx, true)
            }
            onPlaySingleSyllable={(iastSyl) =>
              sanskritAudioEngine.playSingleSyllable(iastSyl)
            }
            onNavigateTab={onNavigateTab}
            navigationRequest={navRequest}
          />
        </div>
      </div>
    </div>
  );
};
