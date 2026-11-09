import React, { useState, useMemo, useEffect } from 'react';
import {
  TAISHO_MIKKYO_INDEX,
  TAISHO_MIKKYO_VOLUME_META,
  TaishoMikkyoIndexEntry
} from '../../data/generated/taishoMikkyoIndex';
import { CBETA_SCRIPTURE_RECORDS } from '../../data/generated/cbetaAuthRecords';
import { fetchLiveCbetaScripture, LiveCbetaScriptureResult } from '../../services/cbeta/cbetaLiveService';
import { CbetaSiddhamInterlinearView } from '../reader/CbetaSiddhamInterlinearView';
import { sanskritAudioEngine } from '../../services/sanskritAudioEngine';

export const TaishoCanonExplorer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [volumeFilter, setVolumeFilter] = useState<'all' | 'T18' | 'T19' | 'T20' | 'T21'>('all');
  const [onlyBundled, setOnlyBundled] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TaishoMikkyoIndexEntry | null>(
    TAISHO_MIKKYO_INDEX.find(e => e.id === 'T19n0974B') || TAISHO_MIKKYO_INDEX[0] || null
  );
  const [liveResult, setLiveResult] = useState<LiveCbetaScriptureResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bundledCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [id, rec] of Object.entries(CBETA_SCRIPTURE_RECORDS)) {
      map[id] = rec.ttPairCount;
    }
    return map;
  }, []);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TAISHO_MIKKYO_INDEX.filter(item => {
      if (volumeFilter !== 'all' && item.vol !== volumeFilter) return false;
      const bundledPairs = bundledCountMap[item.id] || 0;
      if (onlyBundled && bundledPairs === 0) return false;
      if (!q) return true;
      return (
        item.id.toLowerCase().includes(q) ||
        item.sutraNo.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.translator.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, volumeFilter, onlyBundled, bundledCountMap]);

  const handleSelectScripture = async (entry: TaishoMikkyoIndexEntry) => {
    setSelectedEntry(entry);
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLiveCbetaScripture(entry.id, entry.vol, entry.xmlUrl);
      setLiveResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEntry && !liveResult && !loading) {
      handleSelectScripture(selectedEntry);
    }
  }, []);

  return (
    <div className="sdk-canon-explorer">
      <div className="sdk-canon-header">
        <div>
          <h2 className="sdk-section-title">
            《大正新修大藏经》密教部全目与实时解析器 (T18–T21 · {TAISHO_MIKKYO_INDEX.length} 部)
          </h2>
          <p className="sdk-section-desc">
            直连 CBETA GitHub <code>xml-p5</code> 权威经藏，实时拉取并解析任意密教部经典的
            <code>&lt;cb:tt&gt;</code> 悉昙字码对勘（<code>#SD-*</code> / <code>#RJ-*</code>）与
            <code>&lt;p cb:type=&quot;dharani&quot;&gt;</code> 陀罗尼全文。
          </p>
        </div>
        <div className="sdk-canon-stats">
          <div className="sdk-stat-card">
            <span className="sdk-stat-num">{TAISHO_MIKKYO_INDEX.length}</span>
            <span className="sdk-stat-label">密教部经典总数</span>
          </div>
          <div className="sdk-stat-card">
            <span className="sdk-stat-num">
              {Object.keys(CBETA_SCRIPTURE_RECORDS).length}
            </span>
            <span className="sdk-stat-label">预置本地权威缓存经轨</span>
          </div>
        </div>
      </div>

      <div className="sdk-canon-toolbar">
        <input
          type="search"
          className="sdk-input"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索大正藏经号 (如 T19n0974B, T20n1113B, T18n0848) 或经名..."
        />
        <div className="sdk-volume-tabs">
          <button
            type="button"
            className={`sdk-chip ${volumeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setVolumeFilter('all')}
          >
            全部卷册 (T18–T21)
          </button>
          {TAISHO_MIKKYO_VOLUME_META.map(v => (
            <button
              key={v.vol}
              type="button"
              className={`sdk-chip ${volumeFilter === v.vol ? 'active' : ''}`}
              onClick={() => setVolumeFilter(v.vol)}
              title={v.title}
            >
              {v.vol} ({v.range})
            </button>
          ))}
        </div>
        <label className="sdk-checkbox-label">
          <input
            type="checkbox"
            checked={onlyBundled}
            onChange={e => setOnlyBundled(e.target.checked)}
          />
          <span>仅显示已预打包悉昙逐字对勘经轨</span>
        </label>
      </div>

      <div className="sdk-canon-grid">
        <div className="sdk-canon-list">
          {filteredEntries.map(entry => {
            const isActive = selectedEntry?.id === entry.id;
            const pairCount = bundledCountMap[entry.id] || 0;
            return (
              <button
                key={entry.id}
                type="button"
                className={`sdk-canon-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectScripture(entry)}
              >
                <div className="sdk-canon-item-top">
                  <span className="sdk-canon-id">{entry.id}</span>
                  {pairCount > 0 && (
                    <span className="sdk-badge sdk-badge-gold">
                      已内置 {pairCount} 悉昙字对
                    </span>
                  )}
                </div>
                <div className="sdk-canon-title">{entry.title}</div>
                <div className="sdk-canon-sub">{entry.translator}</div>
              </button>
            );
          })}
        </div>

        <div className="sdk-canon-detail">
          {loading && (
            <div className="sdk-loading-panel">
              正在从 CBETA <code>xml-p5</code> 解析 {selectedEntry?.id}...
            </div>
          )}

          {error && (
            <div className="sdk-error-panel">
              <h4>解析提示</h4>
              <p>{error}</p>
            </div>
          )}

          {!loading && liveResult && (
            <div className="sdk-live-result">
              <div className="sdk-live-header">
                <div>
                  <div className="sdk-live-badges">
                    <span className="sdk-badge sdk-badge-cbeta">{liveResult.id}</span>
                    <span className="sdk-badge sdk-badge-outline">
                      {liveResult.fetchedFromCache ? '本地权威缓存 (Instant)' : 'CBETA GitHub 实时解析'}
                    </span>
                  </div>
                  <h3>{liveResult.title}</h3>
                  <p className="sdk-live-author">{liveResult.translator}</p>
                </div>
                <a
                  href={liveResult.xmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sdk-btn sdk-btn-outline"
                >
                  查看 CBETA TEI-P5 XML 源码 ↗
                </a>
              </div>

              {liveResult.ttPairs.length > 0 && (
                <CbetaSiddhamInterlinearView
                  record={{
                    id: liveResult.id,
                    vol: liveResult.vol,
                    dharaniId: liveResult.id,
                    title: liveResult.title,
                    translator: liveResult.translator,
                    rawUrl: liveResult.xmlUrl,
                    dharaniParagraphs: liveResult.dharaniParagraphs,
                    ttPairCount: liveResult.ttPairs.length,
                    ttPairs: liveResult.ttPairs,
                    rawXmlExcerpt: liveResult.rawXmlPreview
                  }}
                  audioMode="auto"
                  speechRate={0.82}
                />
              )}

              <div className="sdk-dharani-paragraphs-section">
                <h4>经内陀罗尼段落摘录 ({liveResult.dharaniParagraphs.length} 段)</h4>
                {liveResult.dharaniParagraphs.length === 0 ? (
                  <p className="sdk-muted">
                    此经以仪轨/义理散文为主，未单独标记 <code>cb:type=&quot;dharani&quot;</code> 标签。
                  </p>
                ) : (
                  <div className="sdk-dharani-paragraphs">
                    {liveResult.dharaniParagraphs.map((para, idx) => (
                      <div key={idx} className="sdk-dharani-para-card">
                        <div className="sdk-dharani-para-head">
                          <span>陀罗尼段落 #{idx + 1}</span>
                          <button
                            type="button"
                            className="sdk-btn sdk-btn-sm sdk-btn-outline"
                            onClick={() =>
                              sanskritAudioEngine.speakVerseIast('oṃ sarva tathāgata svāhā', {
                                mode: 'auto',
                                rate: 0.85
                              })
                            }
                          >
                            🔊 梵音试听
                          </button>
                        </div>
                        <p className="sdk-dharani-para-text">{para}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {liveResult.rawXmlPreview && (
                <div className="sdk-source-block">
                  <h4>CBETA TEI-P5 原始 XML 片段预览</h4>
                  <pre className="sdk-raw-code-box">{liveResult.rawXmlPreview}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
