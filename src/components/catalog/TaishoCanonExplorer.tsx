import React, { useState, useMemo, useEffect } from 'react';
import {
  Library,
  Search,
  ExternalLink,
  FileCode,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  TAISHO_MIKKYO_FILE_INDEX,
  TOTAL_TAISHO_MIKKYO_DHARANI_BLOCKS,
  type TaishoMikkyoFileEntry,
} from '../../data/kosa-generated/taishoMikkyoIndex';
import {
  fetchAndParseCbetaXmlLive,
  type LiveParsedCbetaSutra,
} from '../../services/cbeta/cbetaLiveService';

interface TaishoCanonExplorerProps {
  initialScriptureId?: string | null;
}

export const TaishoCanonExplorer: React.FC<TaishoCanonExplorerProps> = ({
  initialScriptureId,
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

  return (
    <div className="section-panel">
      <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.9rem' }}>
        <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Library size={20} color="var(--accent-vermilion)" />
          <span>
            大正新修大藏经·密教部全集（T18–T21 共 {TAISHO_MIKKYO_FILE_INDEX.length} 部经轨 · 累计{' '}
            {TOTAL_TAISHO_MIKKYO_DHARANI_BLOCKS.toLocaleString()} 段真言）实时原典库
          </span>
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          本模块已全量抓取并索引 <code>github.com/cbeta-org/xml-p5</code> 密教部全部 614 部经典之汉文经题、译者及{' '}
          <strong>14,485 段</strong> <code>&lt;p cb:type="dharani"&gt;</code> 真言！您可在左侧按经名（如「孔雀」「秽迹」「欢喜天」「摩利支」「雨宝」「焰口」「北斗」）、译者或咒句检索，点击即刻展示原典全文真言。
        </p>
      </div>

      <div className="taisho-explorer-layout">
        {/* Left List of 614 Scriptures with Full Chinese Titles & Dharani Counts */}
        <div
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '720px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.75rem',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
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

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredFiles.map((item) => {
              const active = item.id === selectedFile.id;
              return (
                <button
                  key={item.id}
                  id={`taisho-file-item-${item.id}`}
                  type="button"
                  className={`catalog-entry-item ${active ? 'selected' : ''}`}
                  onClick={() => setSelectedFile(item)}
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
        </div>

        {/* Right Live Parsed CBETA Sutra Display */}
        <div
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {loading && (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              <Loader2 size={18} />
              <span>
                正在从 CBETA 官方库实时拉取并解析《{selectedFile.id} · {selectedFile.titleZh}》...
              </span>
            </div>
          )}

          {error && (
            <div className="meta-box" style={{ borderLeftColor: 'var(--accent-vermilion)' }}>
              <div className="meta-box-label">实时拉取提示</div>
              <div>{error}</div>
            </div>
          )}

          {!loading && liveSutra && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.85rem',
                }}
              >
                <div>
                  <span className="taisho-pill">{liveSutra.id}</span>
                  <h3
                    style={{
                      fontSize: '1.35rem',
                      marginTop: '0.4rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {selectedFile.titleZh}（{liveSutra.titleZh}）
                  </h3>
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      marginTop: '0.15rem',
                    }}
                  >
                    译者/撰者：{selectedFile.translator} · 提取到{' '}
                    <code>cb:type="dharani"</code> 独立真言段落：
                    <strong style={{ color: 'var(--accent-vermilion)', marginLeft: '4px' }}>
                      {liveSutra.dharaniBlocks.length} 段
                    </strong>
                  </div>
                </div>

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
              </div>

              {liveSutra.dharaniBlocks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--accent-vermilion)',
                    }}
                  >
                    本经提取之陀罗尼真言原文段落（共 {liveSutra.dharaniBlocks.length} 段，已自动还原 CBETA 罕见音译字）：
                  </div>
                  {liveSutra.dharaniBlocks.map((blk) => (
                    <div key={`${liveSutra.id}-blk-${blk.index}`} className="verse-card">
                      <div className="verse-card-header">
                        <span className="verse-index-badge">真言段 #{blk.index}</span>
                        {blk.tangNotes.length > 0 && (
                          <span className="tang-note-tag">
                            <Sparkles size={11} style={{ marginRight: '4px' }} />
                            含原典夹注 {blk.tangNotes.length} 处
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '1.04rem',
                          lineHeight: 1.75,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {blk.text}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="meta-box">
                  <div className="meta-box-label">经文结构说明</div>
                  <div>
                    本经中的真言嵌于经文正文中（未使用独立 <code>cb:type="dharani"</code>{' '}
                    标记），以下展示经文正文摘要：
                  </div>
                </div>
              )}

              <div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '0.35rem',
                  }}
                >
                  经文正文前段预览：
                </div>
                <div
                  className="raw-code-block"
                  style={{
                    fontFamily: 'var(--font-zh-serif)',
                    fontSize: '0.92rem',
                    lineHeight: 1.7,
                  }}
                >
                  {liveSutra.bodyPreviewText}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
