import React from 'react';

export type ActiveViewTab =
  | 'reader'
  | 'taisho-explorer'
  | 'phonetics-academy'
  | 'custom-compiler'
  | 'interlinear'
  | 'hub';

interface HeaderProps {
  activeTab: ActiveViewTab;
  onSelectTab: (tab: ActiveViewTab) => void;
  totalCount: number;
  favoritesCount: number;
  customCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  totalCount,
  favoritesCount,
  customCount
}) => {
  return (
    <header className="sdk-header">
      <div className="sdk-header-inner">
        <div className="sdk-brand" onClick={() => onSelectTab('reader')} style={{ cursor: 'pointer' }}>
          <div className="sdk-seed-emblem" title="悉昙种子字 Oṃ (𑖼𑗀)">
            𑖼𑗀
          </div>
          <div className="sdk-brand-titles">
            <h1 className="sdk-title-main">
              梵音宝典 <span className="sdk-title-sanskrit">Sarva-Dhāraṇī-Kośa</span>
            </h1>
            <p className="sdk-title-sub">
              密教部陀罗尼多体文字对勘 · 悉昙梵汉对音 · 轻重音律切分与 48kHz 神经梵音合成系统
            </p>
          </div>
        </div>

        <div className="sdk-header-meta">
          <div className="sdk-meta-pill" title="数据直接提取自 CBETA XML-P5 密教部 T18–T21 原典">
            <span className="sdk-dot sdk-dot-cinnabar" />
            CBETA TEI-P5 原典验证
          </div>
          <div className="sdk-meta-pill" title="梵文底本对照哥廷根大学 GRETIL 与 DSBC 梵文佛典库">
            <span className="sdk-dot sdk-dot-gold" />
            Göttingen GRETIL 梵本
          </div>
          <a
            href="/sanskrit_phonetic_engine.html"
            target="_blank"
            rel="noopener noreferrer"
            className="sdk-meta-pill"
            style={{ textDecoration: 'none', color: '#f4e8c1' }}
            title="打开独立版梵文发声与音译引擎 v3.0 (四线谱 + 34×14 矩阵 + 48kHz VITS)"
          >
            <span className="sdk-dot sdk-dot-jade" />
            独立版发音引擎 v3.0 ↗
          </a>
        </div>
      </div>

      <nav className="sdk-nav-tabs" aria-label="主导航栏">
        <button
          type="button"
          className={`sdk-nav-tab ${activeTab === 'reader' ? 'active' : ''}`}
          onClick={() => onSelectTab('reader')}
        >
          <span className="sdk-tab-icon">📜</span>
          <span>陀罗尼多体总持典</span>
          <span className="sdk-tab-badge">{totalCount}部</span>
        </button>

        <button
          type="button"
          className={`sdk-nav-tab ${activeTab === 'taisho-explorer' ? 'active' : ''}`}
          onClick={() => onSelectTab('taisho-explorer')}
        >
          <span className="sdk-tab-icon">🏛️</span>
          <span>大正藏密教部原典库</span>
          <span className="sdk-tab-badge">T18–T21 · 614部</span>
        </button>

        <button
          type="button"
          className={`sdk-nav-tab ${activeTab === 'phonetics-academy' ? 'active' : ''}`}
          onClick={() => onSelectTab('phonetics-academy')}
        >
          <span className="sdk-tab-icon">𑖀</span>
          <span>悉昙五十字母与声明学</span>
          <span className="sdk-tab-badge">唐代音注</span>
        </button>

        <button
          type="button"
          className={`sdk-nav-tab ${activeTab === 'custom-compiler' ? 'active' : ''}`}
          onClick={() => onSelectTab('custom-compiler')}
        >
          <span className="sdk-tab-icon">⚡</span>
          <span>梵音100%全覆盖编译器</span>
          {customCount > 0 && <span className="sdk-tab-badge">+{customCount}</span>}
        </button>

        <button
          type="button"
          className={`sdk-nav-tab ${activeTab === 'interlinear' ? 'active' : ''}`}
          onClick={() => onSelectTab('interlinear')}
        >
          <span className="sdk-tab-icon">🗿</span>
          <span>房山石经与T54对音</span>
          <span className="sdk-tab-badge">916对音</span>
        </button>

        <button
          type="button"
          className={`sdk-nav-tab ${activeTab === 'hub' ? 'active' : ''}`}
          onClick={() => onSelectTab('hub')}
        >
          <span className="sdk-tab-icon">🌐</span>
          <span>全球12大数据库与同源对勘</span>
          <span className="sdk-tab-badge">12库 · ★{favoritesCount}</span>
        </button>
      </nav>
    </header>
  );
};
