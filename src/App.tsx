import React, { useState, useMemo, useEffect } from 'react';
import type { DatabaseId } from './types/corpus';
import type {
  AudioEngineMode,
  AudioHealthStatus,
  NeuralVoice,
  SyllableTimingItem,
} from './types/dharani';
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
import {
  sanskritAudioEngine,
  speakSanskrit,
} from './services/sanskritAudioEngine';

import { DatabaseHubExplorer } from './components/DatabaseHubExplorer';
import { MultiScriptDharaniReader } from './components/MultiScriptDharaniReader';
import { FangshanTaishoInterlinearStudio } from './components/FangshanTaishoInterlinearStudio';
import { ConcordanceParallelStudio } from './components/ConcordanceParallelStudio';
import { CudlPalmLeafViewer } from './components/CudlPalmLeafViewer';
import { SiddhamBijaAcademy } from './components/SiddhamBijaAcademy';
import { AudioPlayerBar } from './components/AudioPlayerBar';

export type WorkbenchTabId =
  | 'hub'
  | 'reader'
  | 'interlinear'
  | 'concordance'
  | 'cudl'
  | 'academy'
  | 'engine';

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
    labelZh: '多體陀羅尼讀誦・音韻與 48kHz / 136.1Hz 合成器',
    labelEn: 'Multi-Script Reader & Phonetics',
  },
  {
    id: 'interlinear',
    labelZh: '房山石經 (F28n1071) 與大正藏 (T54/T18-21) 梵漢對音',
    labelEn: 'Fangshan & Taishō Interlinear Studio',
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
    labelZh: '悉曇十八章・五十音全表與密續種子字 (Bīja)',
    labelEn: 'Siddhaṃ 18-Chapter & Bīja Academy',
  },
  {
    id: 'engine',
    labelZh: '梵音 100% 全覆蓋音譯與發聲引擎 v3.0',
    labelEn: 'Standalone 4-Line Score & 48kHz VITS Engine',
  },
];

export function App() {
  const [activeTab, setActiveTab] = useState<WorkbenchTabId>('hub');
  const [quickQuery, setQuickQuery] = useState<string>('');

  const [isPlaying, setIsPlaying] = useState<boolean>(sanskritAudioEngine.isPlaying());
  const [activeSyllableIndex, setActiveSyllableIndex] = useState<number>(
    sanskritAudioEngine.getActiveSyllableIndex()
  );
  const [syllableTimings, setSyllableTimings] = useState<SyllableTimingItem[]>(
    sanskritAudioEngine.getActiveTimings()
  );
  const [audioRate, setAudioRate] = useState<number>(sanskritAudioEngine.getRate());
  const [audioMode, setAudioMode] = useState<AudioEngineMode>(sanskritAudioEngine.getMode());
  const [audioVoice, setAudioVoice] = useState<NeuralVoice>(sanskritAudioEngine.getVoice());
  const [healthStatus, setHealthStatus] = useState<AudioHealthStatus>(
    sanskritAudioEngine.getHealthStatus()
  );
  const [lastWavDataUrl, setLastWavDataUrl] = useState<string | null>(
    sanskritAudioEngine.getLastDownloadWavUrl()
  );

  useEffect(() => {
    const unsubscribe = sanskritAudioEngine.subscribe(() => {
      setIsPlaying(sanskritAudioEngine.isPlaying());
      setActiveSyllableIndex(sanskritAudioEngine.getActiveSyllableIndex());
      setSyllableTimings([...sanskritAudioEngine.getActiveTimings()]);
      setAudioRate(sanskritAudioEngine.getRate());
      setAudioMode(sanskritAudioEngine.getMode());
      setAudioVoice(sanskritAudioEngine.getVoice());
      setHealthStatus(sanskritAudioEngine.getHealthStatus());
      setLastWavDataUrl(sanskritAudioEngine.getLastDownloadWavUrl());
    });
    void sanskritAudioEngine.init();
    return unsubscribe;
  }, []);

  const activeSyllable = useMemo(
    () =>
      activeSyllableIndex >= 0
        ? syllableTimings.find((t) => t.index === activeSyllableIndex) || null
        : null,
    [activeSyllableIndex, syllableTimings]
  );

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
          <div className="pill-group">
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                speakSanskrit(headerInvocation.normalizedIast, { mode: 'synth' });
                void sanskritAudioEngine.speakText(headerInvocation.normalizedIast);
              }}
            >
              護摩禮讚: {headerInvocation.siddhamUnicode} ({headerInvocation.normalizedIast})
            </button>
            <a
              href="/sanskrit_phonetic_engine.html"
              target="_blank"
              rel="noreferrer"
              className="pill-btn"
            >
              ↗ 獨立開啟四行譜音譯引擎 v3.0
            </a>
          </div>
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
        {activeTab === 'engine' && (
          <div className="workbench-card">
            <div className="workbench-header-row">
              <div>
                <h2 className="workbench-title">
                  梵音 · Sanskrit Phonetics 100% 全覆蓋四行譜音譯與 48,000 Hz 神經發聲引擎 v3.0
                </h2>
                <p className="workbench-subtitle">
                  整合會話 1《梵文發聲與音譯引擎上線》與會話 3《改善語音發音方案》之完整四行對照譜 (現代聽感近似音 + 唐代悉曇古音 + 音節切分/連音注記 + 天城體/IAST/詩律輕重音) 與悉曇五十音抽屜
                </p>
              </div>
              <a
                href="/sanskrit_phonetic_engine.html"
                target="_blank"
                rel="noreferrer"
                className="primary-btn"
              >
                ↗ 於新分頁全螢幕開啟 (sanskrit_phonetic_engine.html)
              </a>
            </div>
            <div className="engine-iframe-wrapper">
              <iframe
                src="/sanskrit_phonetic_engine.html"
                title="梵音 Sanskrit Phonetics Engine v3.0"
                className="engine-iframe"
              />
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div>
          已接入權威數據庫 ({UNIFIED_12_DATABASES.length}): {CANONICAL_DATABASE_IDS.join(' · ')}
        </div>
        <div>
          四語詞條: {systemStats.quadrilingualGlossaryCount} · 精校陀羅尼: {BASELINE_CORPUS_SUMMARY.curatedDharanisCount} 首 ·
          48,000 Hz 原生梵語神經模型 (ninada-vits-sanskrit-48khz) & 136.1 Hz Web Audio 共振峰合成器雙引擎就緒
        </div>
      </footer>

      <AudioPlayerBar
        isPlaying={isPlaying}
        activeSyllableIndex={activeSyllableIndex}
        activeSyllable={activeSyllable}
        syllableTimings={syllableTimings}
        rate={audioRate}
        audioMode={audioMode}
        voice={audioVoice}
        healthStatus={healthStatus}
        lastWavDataUrl={lastWavDataUrl}
        onRateChange={(r) => {
          setAudioRate(r);
          sanskritAudioEngine.setRate(r);
        }}
        onModeChange={(m) => {
          setAudioMode(m);
          sanskritAudioEngine.setMode(m);
        }}
        onVoiceChange={(v) => {
          setAudioVoice(v);
          sanskritAudioEngine.setVoice(v);
        }}
        onStop={() => sanskritAudioEngine.stop()}
        onPlayDefault={() =>
          void sanskritAudioEngine.speakText(
            'tadyathā oṃ gate gate pāragate pārasaṃgate bodhi svāhā'
          )
        }
        onPlaySingleSyllable={(slp1) =>
          void sanskritAudioEngine.playSyllable(slp1)
        }
      />
    </div>
  );
}

export default App;
