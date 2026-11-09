/**
 * 顶部导航与统计概览栏 (src/components/layout/Header.tsx)
 */

import React from 'react';
import { BookOpen, Compass, GraduationCap, Sparkles, Database, ExternalLink } from 'lucide-react';
import { ActiveTabView } from '../../types/dharani';
import { CBETA_SANSKRIT_GAIJI_COUNT, CBETA_TOTAL_TT_PAIRS } from '../../data/generated/cbetaAuthRecords';
import { GRETIL_MANUSCRIPT_RECORDS } from '../../data/generated/gretilAuthRecords';
import { TAISHO_MIKKYO_INDEX } from '../../data/generated/taishoMikkyoIndex';

interface HeaderProps {
  activeTab: ActiveTabView;
  onSelectTab: (tab: ActiveTabView) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab }) => {
  const navItems: { id: ActiveTabView; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: 'reader',
      label: '陀罗尼多体总持典',
      sub: '十维对照 · 悉昙对音 · 轻重音律',
      icon: <BookOpen size={17} />
    },
    {
      id: 'taisho-explorer',
      label: '大正藏密教部原典库',
      sub: `T18–T21 (${TAISHO_MIKKYO_INDEX.length}经实时XML)`,
      icon: <Compass size={17} />
    },
    {
      id: 'phonetics-academy',
      label: '悉昙五十字母与声明学',
      sub: '34×14双轨矩阵 · 发声解剖',
      icon: <GraduationCap size={17} />
    },
    {
      id: 'custom-compiler',
      label: '梵音100%全覆盖编译器',
      sub: '天城/IAST/容错 · 共振峰合成',
      icon: <Sparkles size={17} />
    }
  ];

  return (
    <header className="sdk-header">
      <div className="sdk-header-top">
        <div className="sdk-brand">
          <div className="sdk-seed-emblem" title="一字金轮佛顶种子字 Bhrūṃ">
            <span className="siddham-text">𑖼𑗀</span>
          </div>
          <div>
            <div className="sdk-brand-title-row">
              <h1 className="sdk-title">梵音宝典 · Sarva-Dhāraṇī-Kośa</h1>
              <span className="sdk-version-badge">v2.0 权威原典 + 悉昙声学双轨版</span>
            </div>
            <p className="sdk-subtitle">
              集成 CBETA 官方悉昙字库 ({CBETA_SANSKRIT_GAIJI_COUNT.toLocaleString()} 字) · 唐代不空/菩提流志原典{' '}
              <code>&lt;cb:tt&gt;</code> 梵汉对音 ({CBETA_TOTAL_TT_PAIRS.toLocaleString()} 组) · 德国哥廷根大学 GRETIL 梵文贝叶经 ({GRETIL_MANUSCRIPT_RECORDS.length} 部)
            </p>
          </div>
        </div>

        <div className="sdk-provenance-pills">
          <span className="sdk-pill" title="cbeta-org/cbeta_gaiji & xml-p5">
            <Database size={13} />
            CBETA TEI-P5 原典验证
          </span>
          <span className="sdk-pill" title="INDOLOGY/GRETIL-mirror">
            <Database size={13} />
            Göttingen GRETIL 梵本
          </span>
          <a
            href="/sanskrit_phonetic_engine.html"
            target="_blank"
            rel="noopener noreferrer"
            className="sdk-pill sdk-pill-link"
            title="打开独立版《梵音 100% 全覆盖音译与发声引擎 v2.0》单页工作台"
          >
            <ExternalLink size={13} />
            独立版发音引擎 v2.0
          </a>
        </div>
      </div>

      <nav className="sdk-nav-tabs" aria-label="主功能导航">
        {navItems.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`sdk-nav-tab ${activeTab === item.id ? 'active' : ''}`}
          >
            <span className="sdk-nav-icon">{item.icon}</span>
            <span className="sdk-nav-text">
              <span className="sdk-nav-label">{item.label}</span>
              <span className="sdk-nav-sub">{item.sub}</span>
            </span>
          </button>
        ))}
      </nav>
    </header>
  );
};
