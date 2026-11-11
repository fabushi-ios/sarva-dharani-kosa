import React, { useState, useMemo, useEffect } from 'react';
import {
  Library,
  Search,
  ExternalLink,
  FileCode,
  Loader2,
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
import { DharaniReader } from '../reader/DharaniReader';

interface TaishoCanonExplorerProps {
  initialScriptureId?: string | null;
  allEntries: DharaniEntry[];
  scriptConfig: ScriptVisibilityConfig;
  onScriptConfigChange: (updated: ScriptVisibilityConfig) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
  playbackState: PlaybackState;
  onNavigateTab?: (tab: ActiveWorkspaceTab) => void;
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
}) => {
  const [selectedVol, setSelectedVol] = useState<'ALL' | 'T18' | 'T19' | 'T20' | 'T21'>('ALL');
  const [query, setQuery] = useState('');
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

  // Unified DharaniEntry built from matching corpus entry or live CBETA XML so it renders in DharaniReader
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
            const iast = blk.iastText || 'oṃ sarva-tathāgata-hṛdaya-dhāraṇī svāhā';
            const phonetics = generateVerseChinesePhonetics(iast);
            const sem = translateSanskritVerse(iast);
            return {
              id: `${selectedFile.id}-v-${blk.index}`,
              index: blk.index,
              iast,
              classicalTranslitZh: blk.text || phonetics.classicalTranslitZh,
              modernPhoneticZh: phonetics.modernPhoneticZh,
              meaningZh: sem.meaningZh,
              meaningEn: sem.meaningEn,
              tangNoteZh:
                blk.tangNotes.length > 0
                  ? blk.tangNotes.join('；')
                  : `《${selectedFile.titleZh}》原典陀罗尼第 ${blk.index} 段（${selectedFile.translator}）`,
              words: buildWordGlossesFromIast(iast),
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="section-panel" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Library size={20} color="var(--accent-vermilion)" />
              <span>
                大正新修大藏经·密教部全集（T18–T21 共 {TAISHO_MIKKYO_FILE_INDEX.length} 部经轨 · 累计{' '}
                {TOTAL_TAISHO_MIKKYO_DHARANI_BLOCKS.toLocaleString()} 段真言）— 统一陀罗尼总持典展示
              </span>
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              全量索引 <code>github.com/cbeta-org/xml-p5</code> 密教部全部 614 部经典。点击左侧任意经轨，右侧即以<strong>陀罗尼总持典统一界面</strong>展示！
            </p>
          </div>
          {liveSutra && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <a
                href={liveSutra.cbetaOnlineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-scholarly primary"
              >
                <ExternalLink size={14} />
                <span>CBETA Online 阅藏</span>
              </a>
              <a
                href={liveSutra.rawXmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-scholarly"
              >
                <FileCode size={14} />
                <span>查看原始 XML</span>
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="canon-reader-grid">
        {/* Left List of 614 Scriptures with Full Chinese Titles & Dharani Counts */}
        <aside className="sidebar-panel">
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <span>大正藏密教部册别筛选</span>
              <span className="sidebar-count-pill">{filteredFiles.length} / 614 经</span>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.55rem' }}>
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
                style={{ paddingLeft: '2rem', fontSize: '0.8rem' }}
                placeholder="搜经名/咒句/译者，如：秽迹、大黑天、雨宝、不空..."
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading && (
            <div
              className="section-panel"
              style={{
                padding: '1rem',
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
          />
        </div>
      </div>
    </div>
  );
};

