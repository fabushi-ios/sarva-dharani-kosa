import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  CustomDharaniCompiler,
  buildCompiledDharaniEntry,
  normalizeCompilerLineToIast,
  splitCompilerInputIntoClauses,
} from '../../src/components/extensibility/CustomDharaniCompiler';
import type { PlaybackState } from '../../src/services/audio/sanskritAudioEngine';
import { App } from '../../src/App';

const ROOT_DIR = path.resolve(__dirname, '../..');

const MOCK_IDLE_PLAYBACK: PlaybackState = {
  isPlaying: false,
  currentVerseIndex: null,
  currentSyllableIndex: null,
  currentSyllableInfo: null,
  currentSyllableClassicalZh: '',
  currentSyllableModernZh: '',
  syllableProgress: 0,
  verseProgress: 0,
  rate: 1.0,
  loopVerse: false,
  autoScroll: true,
  mode: 'neural-vits-48k',
  voice: 'male',
  omDroneActive: false,
  backendOnline: true,
  spriteCount: 612,
};

describe('Unified Sanskrit Compiler & Full-Dharani Pronunciation Workbench', () => {
  it('normalizes Devanāgarī, rough English spelling, SLP1, and standard IAST into canonical IAST', () => {
    expect(normalizeCompilerLineToIast('ॐ मणि पद्मे हूँ ॥', 'smart')).toBe(
      'oṃ maṇi padme hūṃ ||'
    );
    expect(
      normalizeCompilerLineToIast('om gate gate paragate parasamgate bodhi svaha ||', 'smart')
    ).toBe('oṃ gate gate pāragate pārasaṃgate bodhi svāhā ||');
    expect(normalizeCompilerLineToIast('oM maRi padme hUM ||', 'slp1')).toBe(
      'oṃ maṇi padme hūṃ ||'
    );
    expect(
      normalizeCompilerLineToIast('oṃ tāre tuttāre ture svāhā ||', 'strict')
    ).toBe('oṃ tāre tuttāre ture svāhā ||');
  });

  it('splits multi-line and multi-sentence Dhāraṇīs into clean sequential verses with deterministic export IDs', () => {
    const medicineBuddhaRaw = [
      'namo bhagavate bhaiṣajyaguru vaidūryaprabharājāya |',
      'tathāgatāya arhate samyaksaṃbuddhāya |',
      'tadyathā |',
      'oṃ bhaiṣajye bhaiṣajye mahābhaiṣajye bhaiṣajyasamudgate svāhā ||',
    ].join('\n');

    const clauses = splitCompilerInputIntoClauses(medicineBuddhaRaw, 'smart');
    expect(clauses).toHaveLength(4);
    expect(clauses[0]).toContain('bhaiṣajyaguru');
    expect(clauses[3]).toContain('svāhā ||');

    const entryA = buildCompiledDharaniEntry({
      titleZh: '药师琉璃光如来灌顶真言',
      deityZh: '药师如来',
      rawInput: medicineBuddhaRaw,
      inputMode: 'smart',
      modernPhoneticInput: '',
      translitZhInput: '',
      meaningZhInput: '',
    });

    expect(entryA.verses).toHaveLength(4);
    expect(entryA.taishoNo).toBe('LOCAL-DRAFT');
    expect(entryA.provenance.sourceType).toBe('LOCAL-USER-DRAFT');
    expect(entryA.verses[0].modernPhoneticZh.length).toBeGreaterThan(2);
    expect(entryA.verses[3].classicalTranslitZh.length).toBeGreaterThan(2);

    const entryB = buildCompiledDharaniEntry({
      titleZh: '药师琉璃光如来灌顶真言',
      deityZh: '药师如来',
      rawInput: 'oṃ maṇi padme hūṃ ||',
      inputMode: 'smart',
      modernPhoneticInput: '',
      translitZhInput: '',
      meaningZhInput: '',
    });

    expect(entryB.id).not.toBe(entryA.id);
  });

  it('renders full-dharani recitation controls, MP3/WAV export, and local-draft save without misleading canon wording', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomDharaniCompiler, {
        customEntries: [],
        onAddCustomEntry: vi.fn(),
        onDeleteCustomEntry: vi.fn(),
        onClearAllCustomEntries: vi.fn(),
        playbackState: MOCK_IDLE_PLAYBACK,
        onPlayVerses: vi.fn(),
        onStopPlayback: vi.fn(),
        onPlaySyllable: vi.fn(),
      })
    );

    expect(html).toContain('梵音六体编译与全咒发声工作台');
    expect(html).toContain('id="compiler-play-all-btn"');
    expect(html).toContain('id="compiler-play-verse-0"');
    expect(html).toContain('id="compiler-export-mp3-btn"');
    expect(html).toContain('id="compiler-export-wav-btn"');
    expect(html).toContain('暂存到我的本地草稿夹');
    expect(html).not.toContain('收录入梵音宝典词库');
  });

  it('removes legacy standalone engine iframe/links and isolates local drafts from authoritative allEntries', () => {
    const appSrc = fs.readFileSync(path.join(ROOT_DIR, 'src/App.tsx'), 'utf8');
    const headerSrc = fs.readFileSync(
      path.join(ROOT_DIR, 'src/components/layout/Header.tsx'),
      'utf8'
    );

    expect(appSrc).not.toContain('<iframe');
    expect(appSrc).not.toContain('sanskrit_phonetic_engine.html');
    expect(appSrc).not.toContain('[...customEntries, ...cloudCorpusEntries]');
    expect(headerSrc).not.toContain('sanskrit_phonetic_engine.html');
    expect(headerSrc).not.toContain('独立引擎');

    const renderedApp = renderToStaticMarkup(React.createElement(App));
    expect(renderedApp).toContain('梵音编译与发声台');
    expect(renderedApp).not.toContain('独立引擎');
  });
});
