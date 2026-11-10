import React, { useState, useMemo } from 'react';
import {
  CANONICAL_DATABASE_IDS,
  UNIFIED_12_DATABASES,
  verifyAllDatabasesIntegrity,
} from '../data/unifiedCorpusRegistry';

const CANON_TO_ADAPTER_DB_ID: Record<string, string> = {
  db1_fangshan: 'db1_fangshan',
  db2_taisho_ext: 'db2_taisho_ext',
  db3_dsbc_gretil: 'db3_dsbc_gretil',
  db4_84000: 'db4_84000',
  db5_buddhanexus: 'db5_buddhanexus',
  db6_sarit: 'db6_sarit',
  db7_cudl_hidas: 'db7_cudl_hidas',
  db8_polyglotta: 'db8_polyglotta',
  db9_rkts: 'db9_rkts',
  db10_all_nibs: 'db10_all_nibs',
  db11_idp_cetom: 'db11_idp_dunhuang',
  db12_ochs_muktabodha: 'db12_muktabodha_ochs',
};

interface DatabaseHubExplorerProps {
  activeAdapterDbId?: string;
  onSelectAdapterDbId?: (adapterDbId: string) => void;
}

export function DatabaseHubExplorer({
  activeAdapterDbId = 'all',
  onSelectAdapterDbId,
}: DatabaseHubExplorerProps) {
  const [selectedTier, setSelectedTier] = useState<'all' | 1 | 2 | 3>('all');
  const [cardsCollapsed, setCardsCollapsed] = useState(false);

  const filteredDatabases = useMemo(() => {
    if (selectedTier === 'all') return UNIFIED_12_DATABASES;
    return UNIFIED_12_DATABASES.filter((db) => db.priorityTier === selectedTier);
  }, [selectedTier]);

  const integrityReport = useMemo(() => verifyAllDatabasesIntegrity(), []);

  return (
    <section
      className="dharani-hero-card"
      style={{ marginBottom: '0.75rem', padding: '0.9rem 1.15rem' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <h2 className="hero-title-zh" style={{ fontSize: '1.22rem', margin: 0 }}>
            全球 12 大国际佛典与梵文陀罗尼数据库总览（与「陀罗尼总持典」统一六体对照与 48kHz VITS 跟诵格式）
          </h2>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              marginTop: '0.2rem',
              marginBottom: 0,
            }}
          >
            点击下方任一数据库卡片（DB1 房山石经 ～ DB12 牛津OCHS），下方阅读器即刻按「陀罗尼总持典」统一标准展示该库全部经咒（含六体全咒汇总、现代梵音拼读附IAST、古汉语音译、逐词解析与 48kHz 神经VITS跟诵） · 全库校验：
            <strong> {integrityReport.status}</strong> ({CANONICAL_DATABASE_IDS.length}/12)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`script-toggle-chip ${activeAdapterDbId === 'all' && selectedTier === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSelectedTier('all');
              onSelectAdapterDbId?.('all');
            }}
          >
            全部 12 库
          </button>
          <button
            type="button"
            className={`script-toggle-chip ${selectedTier === 1 ? 'active' : ''}`}
            onClick={() => setSelectedTier(1)}
          >
            Tier 1 (DB1–DB6)
          </button>
          <button
            type="button"
            className={`script-toggle-chip ${selectedTier === 2 ? 'active' : ''}`}
            onClick={() => setSelectedTier(2)}
          >
            Tier 2 (DB7–DB9)
          </button>
          <button
            type="button"
            className={`script-toggle-chip ${selectedTier === 3 ? 'active' : ''}`}
            onClick={() => setSelectedTier(3)}
          >
            Tier 3 (DB10–DB12)
          </button>
          <button
            type="button"
            className="btn-scholarly"
            onClick={() => setCardsCollapsed((c) => !c)}
          >
            {cardsCollapsed ? '展开 12 库详情卡片 ▼' : '收起卡片专注阅读 ▲'}
          </button>
        </div>
      </div>

      {!cardsCollapsed && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))',
            gap: '0.65rem',
            marginTop: '0.75rem',
          }}
        >
          {filteredDatabases.map((db) => {
            const adapterId = CANON_TO_ADAPTER_DB_ID[db.id] || db.id;
            const isSelected = activeAdapterDbId === adapterId;
            return (
              <button
                key={db.id}
                type="button"
                onClick={() => onSelectAdapterDbId?.(adapterId)}
                style={{
                  textAlign: 'left',
                  padding: '0.7rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected
                    ? '2px solid var(--accent-vermilion)'
                    : '1px solid var(--border-subtle)',
                  background: isSelected ? 'var(--accent-vermilion-soft)' : 'var(--bg-elevated)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.28rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '0.12rem 0.45rem',
                      borderRadius: '999px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#6d28d9',
                    }}
                  >
                    DB{db.number} · Tier {db.priorityTier}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {db.totalRecordsCount.toLocaleString()} 条原典
                  </span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {db.nameZh}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {db.institution}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.15rem' }}>
                  {db.scriptsAvailable.map((sc) => (
                    <span
                      key={sc}
                      style={{
                        fontSize: '0.66rem',
                        padding: '0.08rem 0.35rem',
                        borderRadius: '4px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {sc}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
export default DatabaseHubExplorer;

