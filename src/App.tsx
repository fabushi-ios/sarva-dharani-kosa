import React, { useState, useMemo } from 'react';
import type { DatabaseId } from './types/corpus';
import {
  BASELINE_CORPUS_SUMMARY,
  CANONICAL_DATABASE_IDS,
  UNIFIED_12_DATABASES,
  getUnifiedSystemStats,
} from './data/unifiedCorpusRegistry';
import { CONCORDANCE_CLUSTERS } from './core/concordanceEngine';
import { UNIFIED_BIJA_LEXICON } from './core/bijaLexiconEngine';
import { searchAllDatabases } from './core/searchEngine';
import { slp1ToSiddhamUnicode } from './core/transliterator';
import { analyzeSanskritLine } from './core/prosody';
import { speakSanskrit } from './services/sanskritAudioEngine';

import { DatabaseHubExplorer } from './components/DatabaseHubExplorer';
import { MultiScriptDharaniReader } from './components/MultiScriptDharaniReader';
import { FangshanTaishoInterlinearStudio } from './components/FangshanTaishoInterlinearStudio';
import { ConcordanceParallelStudio } from './components/ConcordanceParallelStudio';
import { CudlPalmLeafViewer } from './components/CudlPalmLeafViewer';
import { SiddhamBijaAcademy } from './components/SiddhamBijaAcademy';

export type WorkbenchTabId =
  | 'hub'
  | 'reader'
  | 'interlinear'
  | 'concordance'
  | 'cudl'
  | 'academy';

export const APP_CANONICAL_DATABASE_IDS: DatabaseId[] = [
  'db1_fangshan',
  'db2_taisho_ext',
  'db3_dsbc_gretil',
  'db4_84000',
  'db5_buddhanexus',
  'db6_sarit',
  'db7_cudl_hidas',
  'db8_polyglotta',
  'db9_rkts',
  'db10_all_nibs',
  'db11_idp_dunhuang',
  'db12_muktabodha_ochs',
];

const WORKBENCH_TABS: Array<{ id: WorkbenchTabId; labelZh: string; labelEn: string }> = [
  {
    id: 'hub',
    labelZh: '十二大數據庫總覽與檢索',
    labelEn: '12-Database Hub Explorer',
  },
  {
    id: 'reader',
    labelZh: '多體陀羅尼讀誦・音韻與 136.1 Hz 合成器',
    labelEn: 'Multi-Script Reader & Phonetics',
  },
  {
    id: 'interlinear',
    labelZh: '房山石經 (F28n1071) 與大正藏 (T54) 梵漢對音',
    labelEn: 'Fangshan & T54 Interlinear Studio',
  },
  {
    id: 'concordance',
    labelZh: '跨藏經同源對勘與四語詞典 (Polyglotta / 84000)',
    labelEn: 'Parallel Witness & Concordance',
  },
  {
    id: 'cudl',
    labelZh: '劍橋貝葉經 (CUDL) IIIF 影印與 Hidas 校勘',
    labelEn: 'CUDL IIIF Palm-Leaf Viewer',
  },
  {
    id: 'academy',
    labelZh: '悉曇十八章 (T84) 與密續種子字破譯 (Bīja)',
    labelEn: 'Siddhaṃ 18-Chapter & Bīja Academy',
  },
];

export function App() {
  const [activeTab, setActiveTab] = useState<WorkbenchTabId>('hub');
  const [quickQuery, setQuickQuery] = useState<string>('');

  const systemStats = useMemo(() => getUnifiedSystemStats(), []);
  const headerInvocation = useMemo(
    () => analyzeSanskritLine('oṃ sarvavid svāhā', { mode: 'smart', assimilate: true }),
    []
  );
  const quickSearchHits = useMemo(
    () => (quickQuery.trim() ? searchAllDatabases(quickQuery.trim(), { limit: 6 }) : []),
    [quickQuery]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-top-row">
          <div>
            <h1 className="app-title">
              <span className="siddham-script" style={{ marginRight: '0.5rem' }}>
                {slp1ToSiddhamUnicode('oM')}
              </span>
              梵音寶典 · Sarva-Dhāraṇī-Kośa
            </h1>
            <p className="app-subtitle">
              泛佛教十二大梵藏漢多語陀羅尼語料庫與雙軌音韻學研究平台 · CBETA 悉曇外字 ({BASELINE_CORPUS_SUMMARY.cbetaGaijiCount.toLocaleString()}) ·
              唐代梵漢對音 ({BASELINE_CORPUS_SUMMARY.cbetaTotalTtAlignments} 組) · 大正藏密教部 ({BASELINE_CORPUS_SUMMARY.taishoMikkyoCount} 部) ·
              全庫總紀錄 ({systemStats.totalDatabaseRecords.toLocaleString()} 條) · 同源經群 ({CONCORDANCE_CLUSTERS.length} 組) ·
              密續種子字 ({UNIFIED_BIJA_LEXICON.length} 尊)
            </p>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() => speakSanskrit(headerInvocation.normalizedIast, { mode: 'synth' })}
          >
            護摩禮讚: {headerInvocation.siddhamUnicode} ({headerInvocation.normalizedIast})
          </button>
        </div>

        <div className="quick-search-bar">
          <input
            type="text"
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            placeholder="全平台跨庫快速檢索 (支援 IAST / 天城體 / 悉曇 / 漢文 / 藏文 Wylie / 經號，涵蓋 db1_fangshan .. db12_muktabodha_ochs)..."
            className="text-input"
          />
          {quickSearchHits.length > 0 && (
            <div className="quick-search-dropdown">
              {quickSearchHits.map((hit) => (
                <div key={`${hit.dbId}-${hit.id}`} className="quick-hit-row">
                  <span className="db-badge">{hit.dbId}</span>
                  <strong>{hit.title}</strong> — <span>{hit.snippet.slice(0, 120)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <nav className="workbench-nav" aria-label="Primary Workbenches">
          {WORKBENCH_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="nav-tab-zh">{tab.labelZh}</div>
              <div className="nav-tab-en">{tab.labelEn}</div>
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'hub' && <DatabaseHubExplorer />}
        {activeTab === 'reader' && <MultiScriptDharaniReader />}
        {activeTab === 'interlinear' && <FangshanTaishoInterlinearStudio />}
        {activeTab === 'concordance' && <ConcordanceParallelStudio />}
        {activeTab === 'cudl' && <CudlPalmLeafViewer />}
        {activeTab === 'academy' && <SiddhamBijaAcademy />}
      </main>

      <footer className="app-footer">
        <div>
          已接入權威數據庫 ({UNIFIED_12_DATABASES.length}): {CANONICAL_DATABASE_IDS.join(' · ')}
        </div>
        <div>
          四語詞條: {systemStats.quadrilingualGlossaryCount} · 精校陀羅尼: {BASELINE_CORPUS_SUMMARY.curatedDharanisCount} 首 ·
          136.1 Hz Web Audio 共振峰合成器就緒
        </div>
      </footer>
    </div>
  );
}

export default App;
