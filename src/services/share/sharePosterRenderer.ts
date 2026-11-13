/**
 * src/services/share/sharePosterRenderer.ts
 *
 * High-DPI Mobile Portrait Poster Renderer (1080px wide) for Sarva-Dhāraṇī-Kośa:
 * - Supports 9:16 (1080x1920), 3:4 (1080x1440), and 9:16 Adaptive Long Scroll
 * - Supports Xuan-Paper Light & Indigo-Gold Sūtra Dark themes
 * - Supports both Verse-Row Multi-Script Layout & Granular Siddhaṃ Block Grid Layout
 * - Preserves subscript phonetic markers `₍赫₎` via `parsePhoneticRichSegments`
 * - Embeds crisp ISO/IEC 18004 QR code linking directly to online audio recitation
 */

import type { DharaniEntry, DharaniVerse } from '../../types/kosaTypes';
import { resolveEffectiveVerseFields } from '../../core/provenance/fieldProvenance';
import { analyzeSanskritProsody } from '../../core/sanskrit/prosody';
import {
  enrichSyllablesWithPhonetics,
  parsePhoneticRichSegments,
  type PhoneticRichSegment,
} from '../../core/sanskrit/phoneticMapper';
import { iastToDevanagari, iastToSiddham } from '../../core/sanskrit/transliterator';
import { encodeQrMatrix, renderQrToCanvas } from '../../core/share/qrCodeEncoder';

export type PosterAspectRatio = '9:16' | '3:4' | '9:16-long';
export type PosterThemeId = 'xuan-light' | 'sutra-dark';
export type PosterLayoutStyle = 'verse-rows' | 'siddham-blocks';

export interface ShareableSiddhamBlock {
  id: string;
  verseIndex: number;
  verseNumber: number;
  blockIndex: number;
  siddham: string;
  devanagari: string;
  iast: string;
  modernZh: string;
  classicalZh: string;
  ipa: string;
}

export interface PosterLayerSelection {
  showSiddham: boolean;
  showModernPhoneticZh: boolean;
  showPhoneticIastBracket: boolean;
  showIast: boolean;
  showDevanagari: boolean;
  showClassicalZh: boolean;
  showMeaningZh: boolean;
  showMeaningEn: boolean;
  showIpa: boolean;
  showBijaSeal: boolean;
  showHeaderMeta: boolean;
}

export interface RenderSharePosterOptions {
  entry: DharaniEntry;
  selectedVerseIndices: number[];
  selectedBlockIds: Set<string> | null;
  allBlocks: ShareableSiddhamBlock[];
  layers: PosterLayerSelection;
  ratio: PosterAspectRatio;
  theme: PosterThemeId;
  layoutStyle: PosterLayoutStyle;
  qrUrl: string;
  voiceLabelZh: string;
  modeLabelZh: string;
}

export interface RenderedSharePoster {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  truncatedVerseCount: number;
  fileName: string;
}

interface ThemePalette {
  bgTop: string;
  bgBottom: string;
  cardBg: string;
  cardElevated: string;
  borderOuter: string;
  borderInner: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  vermilion: string;
  vermilionSoft: string;
  gold: string;
  goldSoft: string;
  lapis: string;
  jade: string;
  jadeSoft: string;
  sealBg: string;
  sealText: string;
  qrDark: string;
}

const PALETTES: Record<PosterThemeId, ThemePalette> = {
  'xuan-light': {
    bgTop: '#f8f3e8',
    bgBottom: '#efe5d2',
    cardBg: 'rgba(253, 251, 247, 0.92)',
    cardElevated: 'rgba(241, 234, 220, 0.88)',
    borderOuter: '#b88b3a',
    borderInner: 'rgba(158, 42, 43, 0.34)',
    textPrimary: '#1d1712',
    textSecondary: '#52453a',
    textMuted: '#7b6b5d',
    vermilion: '#9e2a2b',
    vermilionSoft: 'rgba(158, 42, 43, 0.09)',
    gold: '#8a5f14',
    goldSoft: 'rgba(176, 126, 36, 0.14)',
    lapis: '#1d4e6b',
    jade: '#1f5e3f',
    jadeSoft: 'rgba(35, 97, 66, 0.09)',
    sealBg: '#9e2a2b',
    sealText: '#fff8ee',
    qrDark: '#1c1510',
  },
  'sutra-dark': {
    bgTop: '#16120f',
    bgBottom: '#0f0c0a',
    cardBg: 'rgba(31, 26, 21, 0.92)',
    cardElevated: 'rgba(43, 36, 29, 0.9)',
    borderOuter: '#d4a64a',
    borderInner: 'rgba(223, 178, 91, 0.32)',
    textPrimary: '#f4ecde',
    textSecondary: '#cbbba3',
    textMuted: '#948370',
    vermilion: '#eb6b63',
    vermilionSoft: 'rgba(224, 93, 86, 0.16)',
    gold: '#e3b760',
    goldSoft: 'rgba(223, 178, 91, 0.16)',
    lapis: '#7ab8e3',
    jade: '#69c999',
    jadeSoft: 'rgba(94, 192, 144, 0.14)',
    sealBg: '#b63332',
    sealText: '#fff8ee',
    qrDark: '#19130e',
  },
};

const FONT_STACK_ZH_SERIF =
  "'Noto Serif SC', 'Songti SC', 'Source Han Serif SC', 'STSong', 'Sarva Rare Han', serif";
const FONT_STACK_ZH_SANS =
  "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', 'Sarva Rare Han', sans-serif";
const FONT_STACK_SIDDHAM =
  "'Noto Sans Siddham', 'Noto Serif Devanagari', 'Sarva Rare Han', serif";
const FONT_STACK_DEVANAGARI =
  "'Noto Serif Devanagari', 'Noto Sans Devanagari', 'Kohinoor Devanagari', serif";
const FONT_STACK_IAST = "'Gentium Plus', 'Charis SIL', 'Cambria', Georgia, serif";
const FONT_STACK_MONO = "'JetBrains Mono', 'Fira Code', monospace";

const BIJA_SEAL_MAP: Record<string, { siddham: string; iast: string }> = {
  'hrīḥ': { siddham: '\u{115AE}\u{115BF}\u{115A8}\u{115B1}\u{115BE}', iast: 'hrīḥ' },
  'bhrūṃ': { siddham: '\u{115A5}\u{115BF}\u{115A8}\u{115B3}\u{115BC}', iast: 'bhrūṃ' },
  'dhīḥ': { siddham: '\u{115A0}\u{115B1}\u{115BE}', iast: 'dhīḥ' },
  'hūṃ': { siddham: '\u{115AE}\u{115B3}\u{115BC}', iast: 'hūṃ' },
  'śrīṃ': { siddham: '\u{115AB}\u{115BF}\u{115A8}\u{115B1}\u{115BC}', iast: 'śrīṃ' },
  'oṃ': { siddham: '\u{1158C}\u{115BC}', iast: 'oṃ' },
};

function resolveEntryBijaSeal(entry: DharaniEntry): { siddham: string; iast: string } {
  const explicit = entry.bijaIast ? BIJA_SEAL_MAP[entry.bijaIast] : undefined;
  if (explicit) return explicit;
  const hay = `${entry.titleZh} ${entry.titleSanskritIast} ${entry.deityZh}`.toLowerCase();
  if (hay.includes('尊胜') || hay.includes('uṣṇīṣa') || hay.includes('佛顶')) return BIJA_SEAL_MAP['bhrūṃ'];
  if (hay.includes('观音') || hay.includes('大悲') || hay.includes('avalokite') || hay.includes('弥陀')) return BIJA_SEAL_MAP['hrīḥ'];
  if (hay.includes('文殊') || hay.includes('般若') || hay.includes('心经') || hay.includes('prajñā')) return BIJA_SEAL_MAP['dhīḥ'];
  if (hay.includes('金刚') || hay.includes('明王') || hay.includes('vajra') || hay.includes('百字')) return BIJA_SEAL_MAP['hūṃ'];
  if (hay.includes('吉祥') || hay.includes('lakṣmī')) return BIJA_SEAL_MAP['śrīṃ'];
  return BIJA_SEAL_MAP['oṃ'];
}

export function extractEntrySiddhamBlocks(
  entry: DharaniEntry,
  verseIndices: number[],
  showPhoneticIastBracket: boolean
): ShareableSiddhamBlock[] {
  const blocks: ShareableSiddhamBlock[] = [];

  for (const vIdx of verseIndices) {
    const verse = entry.verses[vIdx];
    if (!verse) continue;
    const enriched = enrichSyllablesWithPhonetics(analyzeSanskritProsody(verse.iast));
    if (enriched.length === 0) continue;

    // Group syllables by orthographic subword so Siddhaṃ & Devanāgarī conjunct ligatures remain intact
    const groups: Array<{
      key: number;
      iast: string;
      modernParts: string[];
      classicalZh: string;
      ipaParts: string[];
    }> = [];

    for (const syl of enriched) {
      const swKey = syl.subwordIndex ?? syl.wordIndex ?? syl.index;
      const modPiece = showPhoneticIastBracket ? `${syl.modernZh}(${syl.iast})` : syl.modernZh;
      const last = groups[groups.length - 1];
      if (last && last.key === swKey) {
        last.iast += syl.iast;
        last.modernParts.push(modPiece);
        last.classicalZh += syl.classicalZh;
        last.ipaParts.push(syl.ipa);
      } else {
        groups.push({
          key: swKey,
          iast: syl.iast,
          modernParts: [modPiece],
          classicalZh: syl.classicalZh,
          ipaParts: [syl.ipa],
        });
      }
    }

    // Preserve original Siddham tokens when matching count exists on the verse
    const origSiddhamTokens = verse.siddhamOriginal
      ? verse.siddhamOriginal
          .trim()
          .split(/\s+/)
          .filter((t) => t && t !== '|' && t !== '||' && t !== '\u{115C2}' && t !== '\u{115C3}')
      : [];

    groups.forEach((g, gIdx) => {
      const siddham =
        origSiddhamTokens.length === groups.length && origSiddhamTokens[gIdx]
          ? origSiddhamTokens[gIdx]
          : iastToSiddham(g.iast);
      blocks.push({
        id: `v${vIdx}-b${gIdx}`,
        verseIndex: vIdx,
        verseNumber: verse.index,
        blockIndex: gIdx,
        siddham: siddham || '\u{11580}',
        devanagari: iastToDevanagari(g.iast),
        iast: g.iast,
        modernZh: g.modernParts.join(''),
        classicalZh: g.classicalZh,
        ipa: g.ipaParts.join(' '),
      });
    });
  }

  return blocks;
}

/**
 * Wraps plain Unicode text (CJK, Siddhaṃ, Devanāgarī, or IAST) within `maxWidth` pixels.
 */
function wrapPlainTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  maxWidth: number
): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  ctx.font = font;

  // Tokenize into space-separated chunks or CJK character units while keeping Latin/Indic words together
  const rawTokens = cleaned.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]|[｜|।॥]|[^\s\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff｜]+|\s+/g) || [cleaned];

  const lines: string[] = [];
  let current = '';

  const pushBrokenLongToken = (tok: string) => {
    let sub = '';
    for (const ch of Array.from(tok)) {
      const test = sub + ch;
      if (sub && ctx.measureText(test).width > maxWidth) {
        lines.push(sub);
        sub = ch;
      } else {
        sub = test;
      }
    }
    if (sub) current = sub;
  };

  for (const tok of rawTokens) {
    if (!current && /^\s+$/.test(tok)) continue;
    const candidate = current + tok;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current.trim()) {
        lines.push(current.trimEnd());
      }
      const trimmedTok = tok.trimStart();
      if (!trimmedTok) {
        current = '';
      } else if (ctx.measureText(trimmedTok).width > maxWidth) {
        current = '';
        pushBrokenLongToken(trimmedTok);
      } else {
        current = trimmedTok;
      }
    }
  }

  if (current.trim()) {
    lines.push(current.trimEnd());
  }
  return lines;
}

interface RichAtom {
  text: string;
  kind: PhoneticRichSegment['kind'];
  width: number;
}

/**
 * Tokenizes & wraps `梵音拼读` text containing `₍...₎` subscript segments without ever splitting a subscript group.
 */
function wrapPhoneticRichLines(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  baseFontSize: number,
  maxWidth: number
): RichAtom[][] {
  const segments = parsePhoneticRichSegments(rawText);
  if (segments.length === 0) return [];

  const normalFont = `600 ${baseFontSize}px ${FONT_STACK_ZH_SANS}`;
  const subFont = `600 ${Math.round(baseFontSize * 0.72)}px ${FONT_STACK_ZH_SANS}`;
  const iastFont = `500 ${Math.round(baseFontSize * 0.86)}px ${FONT_STACK_IAST}`;

  const atoms: RichAtom[] = [];
  for (const seg of segments) {
    if (seg.kind === 'sub') {
      ctx.font = subFont;
      atoms.push({ text: seg.text, kind: 'sub', width: ctx.measureText(seg.text).width + 1 });
    } else if (seg.kind === 'iast') {
      ctx.font = iastFont;
      atoms.push({ text: seg.text, kind: 'iast', width: ctx.measureText(seg.text).width + 2 });
    } else {
      ctx.font = normalFont;
      const pieces = seg.text.match(/\s+|[-｜|]|[\u4e00-\u9fff\u3400-\u4dbf]|[^\s-｜|\u4e00-\u9fff\u3400-\u4dbf]+/g) || [seg.text];
      for (const p of pieces) {
        atoms.push({ text: p, kind: 'normal', width: ctx.measureText(p).width });
      }
    }
  }

  const lines: RichAtom[][] = [];
  let curLine: RichAtom[] = [];
  let curW = 0;

  for (let i = 0; i < atoms.length; i++) {
    const atom = atoms[i];
    if (curLine.length === 0 && /^\s+$/.test(atom.text)) continue;

    // Keep attached subscript or `(iast)` glued to preceding main character when possible
    if (curW + atom.width <= maxWidth || curLine.length === 0) {
      curLine.push(atom);
      curW += atom.width;
    } else {
      lines.push(curLine);
      if (/^\s+$/.test(atom.text)) {
        curLine = [];
        curW = 0;
      } else {
        curLine = [atom];
        curW = atom.width;
      }
    }
  }
  if (curLine.length > 0) {
    lines.push(curLine);
  }
  return lines;
}

function drawPhoneticRichLine(
  ctx: CanvasRenderingContext2D,
  line: RichAtom[],
  x: number,
  baselineY: number,
  baseFontSize: number,
  mainColor: string,
  subColor: string
): void {
  const normalFont = `600 ${baseFontSize}px ${FONT_STACK_ZH_SANS}`;
  const subFont = `600 ${Math.round(baseFontSize * 0.72)}px ${FONT_STACK_ZH_SANS}`;
  const iastFont = `500 ${Math.round(baseFontSize * 0.86)}px ${FONT_STACK_IAST}`;

  let cursorX = x;
  for (const atom of line) {
    if (atom.kind === 'sub') {
      ctx.font = subFont;
      ctx.fillStyle = subColor;
      ctx.fillText(atom.text, cursorX, baselineY + Math.round(baseFontSize * 0.14));
      cursorX += atom.width;
    } else if (atom.kind === 'iast') {
      ctx.font = iastFont;
      ctx.fillStyle = subColor;
      ctx.fillText(atom.text, cursorX, baselineY);
      cursorX += atom.width;
    } else {
      ctx.font = normalFont;
      ctx.fillStyle = mainColor;
      ctx.fillText(atom.text, cursorX, baselineY);
      cursorX += atom.width;
    }
  }
}

interface PreparedVerseCard {
  verseNumber: number;
  rows: Array<
    | {
        kind: 'plain';
        label: string;
        lines: string[];
        font: string;
        lineHeight: number;
        color: string;
        bg?: string;
        accentColor?: string;
      }
    | {
        kind: 'phonetic';
        label: string;
        richLines: RichAtom[][];
        fontSize: number;
        lineHeight: number;
        color: string;
        subColor: string;
        bg: string;
        accentColor: string;
      }
  >;
  totalHeight: number;
}

function buildPreparedVerseCards(
  ctx: CanvasRenderingContext2D,
  opts: RenderSharePosterOptions,
  palette: ThemePalette,
  scale: number,
  cardInnerWidth: number
): PreparedVerseCard[] {
  const cards: PreparedVerseCard[] = [];
  const selectedBlockSet = opts.selectedBlockIds;

  for (const vIdx of opts.selectedVerseIndices) {
    const verse: DharaniVerse | undefined = opts.entry.verses[vIdx];
    if (!verse) continue;

    const verseBlocks = opts.allBlocks.filter((b) => b.verseIndex === vIdx);
    const activeBlocks = selectedBlockSet
      ? verseBlocks.filter((b) => selectedBlockSet.has(b.id))
      : verseBlocks;

    if (selectedBlockSet && verseBlocks.length > 0 && activeBlocks.length === 0) {
      continue;
    }

    const isPartialVerse =
      selectedBlockSet !== null &&
      verseBlocks.length > 0 &&
      activeBlocks.length < verseBlocks.length;

    const eff = resolveEffectiveVerseFields(verse, opts.layers.showPhoneticIastBracket);

    const siddhamStr = isPartialVerse
      ? activeBlocks.map((b) => b.siddham).join(' ')
      : eff.siddhamText;
    const devanagariStr = isPartialVerse
      ? activeBlocks.map((b) => b.devanagari).join(' ')
      : eff.devanagariText;
    const iastStr = isPartialVerse
      ? activeBlocks.map((b) => b.iast).join(' ')
      : eff.iastText;
    const modernStr = isPartialVerse
      ? activeBlocks.map((b) => b.modernZh).join(' ')
      : eff.modernPhoneticZh;
    const classicalStr = isPartialVerse
      ? activeBlocks.map((b) => b.classicalZh).join(' ')
      : eff.classicalTranslitZh;
    const ipaStr = isPartialVerse
      ? activeBlocks.map((b) => b.ipa).join(' ')
      : eff.ipaText;

    const rows: PreparedVerseCard['rows'] = [];
    const textWrapW = cardInnerWidth - 28;

    if (opts.layers.showSiddham && siddhamStr.trim()) {
      const fSize = Math.round(44 * scale);
      const font = `400 ${fSize}px ${FONT_STACK_SIDDHAM}`;
      const lines = wrapPlainTextLines(ctx, siddhamStr, font, textWrapW);
      if (lines.length > 0) {
        rows.push({
          kind: 'plain',
          label: '悉昙梵字',
          lines,
          font,
          lineHeight: Math.round(fSize * 1.48),
          color: palette.vermilion,
        });
      }
    }

    if (opts.layers.showDevanagari && devanagariStr.trim()) {
      const fSize = Math.round(33 * scale);
      const font = `600 ${fSize}px ${FONT_STACK_DEVANAGARI}`;
      const lines = wrapPlainTextLines(ctx, devanagariStr, font, textWrapW);
      if (lines.length > 0) {
        rows.push({
          kind: 'plain',
          label: '天城梵文',
          lines,
          font,
          lineHeight: Math.round(fSize * 1.46),
          color: palette.textPrimary,
        });
      }
    }

    if (opts.layers.showIast && iastStr.trim()) {
      const fSize = Math.round(29 * scale);
      const font = `600 ${fSize}px ${FONT_STACK_IAST}`;
      const lines = wrapPlainTextLines(ctx, iastStr, font, textWrapW);
      if (lines.length > 0) {
        rows.push({
          kind: 'plain',
          label: '梵文 IAST',
          lines,
          font,
          lineHeight: Math.round(fSize * 1.42),
          color: palette.lapis,
        });
      }
    }

    if (opts.layers.showModernPhoneticZh && modernStr.trim()) {
      const fSize = Math.round(28 * scale);
      const richLines = wrapPhoneticRichLines(ctx, modernStr, fSize, textWrapW - 22);
      if (richLines.length > 0) {
        rows.push({
          kind: 'phonetic',
          label: '梵音拼读',
          richLines,
          fontSize: fSize,
          lineHeight: Math.round(fSize * 1.52),
          color: palette.jade,
          subColor: palette.textSecondary,
          bg: palette.jadeSoft,
          accentColor: palette.jade,
        });
      }
    }

    if (opts.layers.showClassicalZh && classicalStr.trim()) {
      const fSize = Math.round(28 * scale);
      const font = `700 ${fSize}px ${FONT_STACK_ZH_SERIF}`;
      const lines = wrapPlainTextLines(ctx, classicalStr, font, textWrapW - 22);
      if (lines.length > 0) {
        rows.push({
          kind: 'plain',
          label: '古汉语音译',
          lines,
          font,
          lineHeight: Math.round(fSize * 1.48),
          color: palette.vermilion,
          bg: palette.vermilionSoft,
          accentColor: palette.vermilion,
        });
      }
    }

    if (opts.layers.showIpa && ipaStr.trim()) {
      const fSize = Math.round(23 * scale);
      const font = `500 ${fSize}px ${FONT_STACK_MONO}`;
      const lines = wrapPlainTextLines(ctx, `/${ipaStr}/`, font, textWrapW);
      if (lines.length > 0) {
        rows.push({
          kind: 'plain',
          label: '国际音标 IPA',
          lines,
          font,
          lineHeight: Math.round(fSize * 1.38),
          color: palette.textSecondary,
        });
      }
    }

    if (opts.layers.showMeaningZh && eff.meaningZh.trim()) {
      const fSize = Math.round(25 * scale);
      const font = `500 ${fSize}px ${FONT_STACK_ZH_SERIF}`;
      const lines = wrapPlainTextLines(ctx, `意译：${eff.meaningZh}`, font, textWrapW - 18);
      if (lines.length > 0) {
        rows.push({
          kind: 'plain',
          label: '汉文意译',
          lines,
          font,
          lineHeight: Math.round(fSize * 1.46),
          color: palette.textPrimary,
          bg: palette.goldSoft,
          accentColor: palette.gold,
        });
      }
    }

    if (opts.layers.showMeaningEn && eff.meaningEn.trim()) {
      const fSize = Math.round(22 * scale);
      const font = `400 italic ${fSize}px ${FONT_STACK_IAST}`;
      const lines = wrapPlainTextLines(ctx, eff.meaningEn, font, textWrapW);
      if (lines.length > 0) {
        rows.push({
          kind: 'plain',
          label: 'English',
          lines,
          font,
          lineHeight: Math.round(fSize * 1.4),
          color: palette.textSecondary,
        });
      }
    }

    if (rows.length === 0) continue;

    const showBadgeHeader = opts.selectedVerseIndices.length > 1 || verse.index > 1;
    let cardH = Math.round(28 * scale) * 2;
    if (showBadgeHeader) {
      cardH += Math.round(34 * scale);
    }

    for (const r of rows) {
      const labelLineH = Math.round(20 * scale);
      if (r.kind === 'phonetic') {
        cardH += labelLineH + r.richLines.length * r.lineHeight + Math.round(22 * scale);
      } else {
        cardH +=
          labelLineH +
          r.lines.length * r.lineHeight +
          (r.bg ? Math.round(22 * scale) : Math.round(12 * scale));
      }
    }

    cards.push({
      verseNumber: verse.index,
      rows,
      totalHeight: cardH,
    });
  }

  return cards;
}

function drawOrnamentalFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: ThemePalette
): void {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, palette.bgTop);
  bgGrad.addColorStop(1, palette.bgBottom);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle top lotus radial glow
  const glow = ctx.createRadialGradient(width / 2, 160, 20, width / 2, 160, 520);
  glow.addColorStop(0, palette.goldSoft);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, 720);

  // Outer & inner traditional manuscript borders
  const m1 = 28;
  const m2 = 38;
  ctx.strokeStyle = palette.borderOuter;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(m1, m1, width - m1 * 2, height - m1 * 2);

  ctx.strokeStyle = palette.borderInner;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(m2, m2, width - m2 * 2, height - m2 * 2);

  // Corner auspicious L-brackets
  const cornerLen = 28;
  ctx.strokeStyle = palette.vermilion;
  ctx.lineWidth = 4;
  const corners: Array<[number, number, number, number]> = [
    [m1 - 2, m1 - 2, 1, 1],
    [width - m1 + 2, m1 - 2, -1, 1],
    [m1 - 2, height - m1 + 2, 1, -1],
    [width - m1 + 2, height - m1 + 2, -1, -1],
  ];
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * cornerLen);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * cornerLen, cy);
    ctx.stroke();
  }
}

export async function renderDharaniSharePoster(
  opts: RenderSharePosterOptions
): Promise<RenderedSharePoster> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed cleanly with fallback fonts
    }
  }

  const canvasWidth = 1080;
  const fixedTargetHeight = opts.ratio === '3:4' ? 1440 : 1920;
  const palette = PALETTES[opts.theme];
  const padX = 68;
  const innerWidth = canvasWidth - padX * 2; // 944px
  const footerHeight = 310;
  const footerBottomMargin = 62;

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = canvasWidth;
  measureCanvas.height = 400;
  const mCtx = measureCanvas.getContext('2d');
  if (!mCtx) {
    throw new Error('浏览器不支持 Canvas 绘图，无法导出分享图片');
  }

  // Measure header height
  const sealReserveW = opts.layers.showBijaSeal ? 156 : 0;
  const titleMaxW = innerWidth - sealReserveW;
  const titleFont = `700 46px ${FONT_STACK_ZH_SERIF}`;
  const titleLines = wrapPlainTextLines(mCtx, opts.entry.titleZh, titleFont, titleMaxW);
  const sktTitleFont = `italic 26px ${FONT_STACK_IAST}`;
  const sktTitleLines = wrapPlainTextLines(
    mCtx,
    opts.entry.titleSanskritIast,
    sktTitleFont,
    titleMaxW
  ).slice(0, 2);

  const headerTopY = 74;
  const metaRowH = opts.layers.showHeaderMeta ? 46 : 0;
  const headerContentH =
    metaRowH +
    titleLines.length * 60 +
    (sktTitleLines.length > 0 ? sktTitleLines.length * 36 + 8 : 0) +
    28;
  const headerBottomY = headerTopY + Math.max(headerContentH, opts.layers.showBijaSeal ? 148 : 96);

  // Filter blocks for siddham-blocks grid mode
  const activeGridBlocks = opts.selectedBlockIds
    ? opts.allBlocks.filter((b) => opts.selectedBlockIds!.has(b.id))
    : opts.allBlocks;

  // Choose optimal scale for fixed ratios ('9:16' or '3:4') vs '9:16-long'
  const candidateScales =
    opts.ratio === '9:16-long' ? [1.0] : [1.04, 0.96, 0.88, 0.8, 0.72, 0.65];

  let chosenScale = candidateScales[candidateScales.length - 1];
  let chosenVerseCards: PreparedVerseCard[] = [];
  let gridMetrics = { cols: 3, tileW: 298, tileH: 220, rows: 1, totalH: 220 };

  const availableFixedBodyH =
    fixedTargetHeight - headerBottomY - footerHeight - footerBottomMargin - 46;

  if (opts.layoutStyle === 'siddham-blocks') {
    for (const sc of candidateScales) {
      const cols = activeGridBlocks.length <= 4 ? 2 : 3;
      const gap = Math.round(18 * sc);
      const tileW = Math.floor((innerWidth - gap * (cols - 1)) / cols);
      let tileH = Math.round(52 * sc);
      if (opts.layers.showSiddham) tileH += Math.round(82 * sc);
      if (opts.layers.showDevanagari) tileH += Math.round(40 * sc);
      if (opts.layers.showModernPhoneticZh) tileH += Math.round(42 * sc);
      if (opts.layers.showClassicalZh) tileH += Math.round(38 * sc);
      if (opts.layers.showIast) tileH += Math.round(36 * sc);
      if (opts.layers.showIpa) tileH += Math.round(30 * sc);
      tileH = Math.max(Math.round(136 * sc), tileH);

      const rowCount = Math.max(1, Math.ceil(activeGridBlocks.length / cols));
      const totalH = rowCount * tileH + Math.max(0, rowCount - 1) * gap;
      chosenScale = sc;
      gridMetrics = { cols, tileW, tileH, rows: rowCount, totalH };
      if (opts.ratio === '9:16-long' || totalH <= availableFixedBodyH) {
        break;
      }
    }
  } else {
    for (const sc of candidateScales) {
      const cards = buildPreparedVerseCards(mCtx, opts, palette, sc, innerWidth);
      const gap = Math.round(20 * sc);
      const totalH =
        cards.reduce((acc, c) => acc + c.totalHeight, 0) +
        Math.max(0, cards.length - 1) * gap;
      chosenScale = sc;
      chosenVerseCards = cards;
      if (opts.ratio === '9:16-long' || totalH <= availableFixedBodyH) {
        break;
      }
    }
  }

  // Compute final canvas height and handle overflow gracefully on fixed portrait cards
  let canvasHeight = fixedTargetHeight;
  let truncatedVerseCount = 0;
  let visibleVerseCards = chosenVerseCards;
  let visibleGridBlocks = activeGridBlocks;

  if (opts.ratio === '9:16-long') {
    const rawBodyH =
      opts.layoutStyle === 'siddham-blocks'
        ? gridMetrics.totalH
        : chosenVerseCards.reduce((acc, c) => acc + c.totalHeight, 0) +
          Math.max(0, chosenVerseCards.length - 1) * 20;
    canvasHeight = Math.max(
      1920,
      headerBottomY + rawBodyH + footerHeight + footerBottomMargin + 68
    );
  } else if (opts.layoutStyle === 'verse-rows') {
    const gap = Math.round(20 * chosenScale);
    let used = 0;
    const fitted: PreparedVerseCard[] = [];
    for (let i = 0; i < chosenVerseCards.length; i++) {
      const c = chosenVerseCards[i];
      const reserveMoreNote = i < chosenVerseCards.length - 1 ? 54 : 0;
      const nextUsed = used + (fitted.length > 0 ? gap : 0) + c.totalHeight;
      if (nextUsed + reserveMoreNote <= availableFixedBodyH || fitted.length === 0) {
        fitted.push(c);
        used = nextUsed;
      } else {
        truncatedVerseCount = chosenVerseCards.length - fitted.length;
        break;
      }
    }
    visibleVerseCards = fitted;
  } else {
    const gap = Math.round(18 * chosenScale);
    const maxRows = Math.max(
      1,
      Math.floor((availableFixedBodyH - 44 + gap) / (gridMetrics.tileH + gap))
    );
    const maxItems = maxRows * gridMetrics.cols;
    if (activeGridBlocks.length > maxItems) {
      visibleGridBlocks = activeGridBlocks.slice(0, maxItems);
      truncatedVerseCount = activeGridBlocks.length - maxItems;
    }
  }

  // Render final high-DPI canvas
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法初始化分享海报画布');
  }

  drawOrnamentalFrame(ctx, canvasWidth, canvasHeight, palette);

  // 1. Header Section
  let curY = headerTopY;
  if (opts.layers.showHeaderMeta) {
    const badgeText = `${opts.entry.taishoNo}  ·  本尊：${opts.entry.deityZh}`;
    ctx.font = `600 22px ${FONT_STACK_ZH_SANS}`;
    const bw = Math.min(titleMaxW, ctx.measureText(badgeText).width + 34);
    ctx.fillStyle = palette.vermilionSoft;
    ctx.beginPath();
    ctx.roundRect(padX, curY, bw, 36, 8);
    ctx.fill();
    ctx.strokeStyle = palette.borderInner;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = palette.vermilion;
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, padX + 17, curY + 19, titleMaxW - 24);
    curY += 48;
  }

  ctx.textBaseline = 'alphabetic';
  ctx.font = titleFont;
  ctx.fillStyle = palette.textPrimary;
  for (const line of titleLines) {
    curY += 52;
    ctx.fillText(line, padX, curY);
    curY += 8;
  }

  if (sktTitleLines.length > 0) {
    ctx.font = sktTitleFont;
    ctx.fillStyle = palette.gold;
    for (const sLine of sktTitleLines) {
      curY += 32;
      ctx.fillText(sLine, padX, curY);
      curY += 4;
    }
  }

  // Right-side Vermilion Bīja Seal
  if (opts.layers.showBijaSeal) {
    const seal = resolveEntryBijaSeal(opts.entry);
    const sealSize = 132;
    const sx = canvasWidth - padX - sealSize;
    const sy = headerTopY + 4;

    ctx.save();
    ctx.fillStyle = palette.sealBg;
    ctx.beginPath();
    ctx.roundRect(sx, sy, sealSize, sealSize, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 248, 238, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(sx + 7, sy + 7, sealSize - 14, sealSize - 14, 10);
    ctx.stroke();

    ctx.fillStyle = palette.sealText;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `400 62px ${FONT_STACK_SIDDHAM}`;
    ctx.fillText(seal.siddham, sx + sealSize / 2, sy + 56);

    ctx.font = `700 20px ${FONT_STACK_IAST}`;
    ctx.fillText(seal.iast, sx + sealSize / 2, sy + 108);
    ctx.restore();
  }

  // Header divider
  const dividerY = headerBottomY - 8;
  ctx.strokeStyle = palette.borderOuter;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(padX, dividerY);
  ctx.lineTo(canvasWidth - padX, dividerY);
  ctx.stroke();

  // 2. Body Content Section
  let bodyY = headerBottomY + 14;

  if (opts.layoutStyle === 'siddham-blocks') {
    const sc = chosenScale;
    const gap = Math.round(18 * sc);
    const { cols, tileW, tileH } = gridMetrics;

    visibleGridBlocks.forEach((blk, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const tx = padX + col * (tileW + gap);
      const ty = bodyY + row * (tileH + gap);

      ctx.save();
      ctx.fillStyle = palette.cardBg;
      ctx.beginPath();
      ctx.roundRect(tx, ty, tileW, tileH, 14);
      ctx.fill();
      ctx.strokeStyle = palette.borderInner;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // Top index tag
      ctx.fillStyle = palette.textMuted;
      ctx.font = `600 ${Math.round(17 * sc)}px ${FONT_STACK_MONO}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`#${idx + 1}`, tx + 14, ty + 10);

      let innerY = ty + Math.round(28 * sc);
      const centerX = tx + tileW / 2;
      const maxTileTextW = tileW - 24;
      ctx.textAlign = 'center';

      if (opts.layers.showSiddham) {
        const fs = Math.round(58 * sc);
        ctx.font = `400 ${fs}px ${FONT_STACK_SIDDHAM}`;
        ctx.fillStyle = palette.vermilion;
        ctx.textBaseline = 'middle';
        ctx.fillText(blk.siddham, centerX, innerY + Math.round(38 * sc), maxTileTextW);
        innerY += Math.round(80 * sc);
      }

      if (opts.layers.showDevanagari) {
        const fs = Math.round(28 * sc);
        ctx.font = `600 ${fs}px ${FONT_STACK_DEVANAGARI}`;
        ctx.fillStyle = palette.textPrimary;
        ctx.textBaseline = 'middle';
        ctx.fillText(blk.devanagari, centerX, innerY + Math.round(18 * sc), maxTileTextW);
        innerY += Math.round(38 * sc);
      }

      if (opts.layers.showModernPhoneticZh && blk.modernZh) {
        const fs = Math.round(26 * sc);
        const richLines = wrapPhoneticRichLines(ctx, blk.modernZh, fs, maxTileTextW);
        if (richLines[0]) {
          const totalLineW = richLines[0].reduce((s, a) => s + a.width, 0);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'alphabetic';
          drawPhoneticRichLine(
            ctx,
            richLines[0],
            centerX - totalLineW / 2,
            innerY + Math.round(26 * sc),
            fs,
            palette.jade,
            palette.textSecondary
          );
          ctx.textAlign = 'center';
        }
        innerY += Math.round(40 * sc);
      }

      if (opts.layers.showClassicalZh && blk.classicalZh) {
        const fs = Math.round(24 * sc);
        ctx.font = `700 ${fs}px ${FONT_STACK_ZH_SERIF}`;
        ctx.fillStyle = palette.vermilion;
        ctx.textBaseline = 'middle';
        ctx.fillText(`古：${blk.classicalZh}`, centerX, innerY + Math.round(17 * sc), maxTileTextW);
        innerY += Math.round(36 * sc);
      }

      if (opts.layers.showIast) {
        const fs = Math.round(24 * sc);
        ctx.font = `600 ${fs}px ${FONT_STACK_IAST}`;
        ctx.fillStyle = palette.lapis;
        ctx.textBaseline = 'middle';
        ctx.fillText(blk.iast, centerX, innerY + Math.round(16 * sc), maxTileTextW);
        innerY += Math.round(34 * sc);
      }

      if (opts.layers.showIpa && blk.ipa) {
        const fs = Math.round(19 * sc);
        ctx.font = `500 ${fs}px ${FONT_STACK_MONO}`;
        ctx.fillStyle = palette.textMuted;
        ctx.textBaseline = 'middle';
        ctx.fillText(`[${blk.ipa}]`, centerX, innerY + Math.round(13 * sc), maxTileTextW);
      }

      ctx.restore();
    });

    const drawnRows = Math.ceil(visibleGridBlocks.length / cols);
    bodyY += drawnRows * tileH + Math.max(0, drawnRows - 1) * gap;
  } else {
    const sc = chosenScale;
    const gap = Math.round(20 * sc);
    const showBadgeHeader =
      opts.selectedVerseIndices.length > 1 ||
      (visibleVerseCards[0] && visibleVerseCards[0].verseNumber > 1);

    for (const card of visibleVerseCards) {
      ctx.save();
      ctx.fillStyle = palette.cardBg;
      ctx.beginPath();
      ctx.roundRect(padX, bodyY, innerWidth, card.totalHeight, 16);
      ctx.fill();
      ctx.strokeStyle = palette.borderInner;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      let ry = bodyY + Math.round(24 * sc);
      const rx = padX + 24;
      const rowInnerW = innerWidth - 48;

      if (showBadgeHeader) {
        ctx.font = `700 ${Math.round(20 * sc)}px ${FONT_STACK_MONO}`;
        ctx.fillStyle = palette.vermilion;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`第 ${String(card.verseNumber).padStart(2, '0')} 句`, rx, ry + Math.round(16 * sc));
        ry += Math.round(34 * sc);
      }

      for (const r of card.rows) {
        // Small script layer caption
        ctx.font = `700 ${Math.round(17 * sc)}px ${FONT_STACK_ZH_SANS}`;
        ctx.fillStyle = palette.textMuted;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(r.label, rx, ry + Math.round(14 * sc));
        ry += Math.round(20 * sc);

        if (r.kind === 'phonetic') {
          const boxH = r.richLines.length * r.lineHeight + Math.round(14 * sc);
          ctx.fillStyle = r.bg;
          ctx.beginPath();
          ctx.roundRect(rx, ry, rowInnerW, boxH, 8);
          ctx.fill();
          ctx.fillStyle = r.accentColor;
          ctx.fillRect(rx, ry, 4, boxH);

          let lineBaseY = ry + Math.round(r.fontSize * 1.12);
          for (const rLine of r.richLines) {
            drawPhoneticRichLine(
              ctx,
              rLine,
              rx + 14,
              lineBaseY,
              r.fontSize,
              r.color,
              r.subColor
            );
            lineBaseY += r.lineHeight;
          }
          ry += boxH + Math.round(10 * sc);
        } else if (r.bg) {
          const fMatch = r.font.match(/(\d+)px/);
          const fPx = fMatch ? Number(fMatch[1]) : Math.round(26 * sc);
          const boxH = r.lines.length * r.lineHeight + Math.round(14 * sc);
          ctx.fillStyle = r.bg;
          ctx.beginPath();
          ctx.roundRect(rx, ry, rowInnerW, boxH, 8);
          ctx.fill();
          if (r.accentColor) {
            ctx.fillStyle = r.accentColor;
            ctx.fillRect(rx, ry, 4, boxH);
          }

          ctx.font = r.font;
          ctx.fillStyle = r.color;
          let lineBaseY = ry + Math.round(fPx * 1.14);
          for (const line of r.lines) {
            ctx.fillText(line, rx + 14, lineBaseY);
            lineBaseY += r.lineHeight;
          }
          ry += boxH + Math.round(10 * sc);
        } else {
          const fMatch = r.font.match(/(\d+)px/);
          const fPx = fMatch ? Number(fMatch[1]) : Math.round(32 * sc);
          ctx.font = r.font;
          ctx.fillStyle = r.color;
          let lineBaseY = ry + Math.round(fPx * 1.06);
          for (const line of r.lines) {
            ctx.fillText(line, rx, lineBaseY);
            lineBaseY += r.lineHeight;
          }
          ry += r.lines.length * r.lineHeight + Math.round(10 * sc);
        }
      }

      ctx.restore();
      bodyY += card.totalHeight + gap;
    }
  }

  if (truncatedVerseCount > 0) {
    ctx.save();
    ctx.font = `600 22px ${FONT_STACK_ZH_SANS}`;
    ctx.fillStyle = palette.gold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const unitLabel = opts.layoutStyle === 'siddham-blocks' ? '个悉昙字块' : '句咒文';
    ctx.fillText(
      `… 余 ${truncatedVerseCount} ${unitLabel}，识别下方二维码可展开全咒同步跟诵 …`,
      canvasWidth / 2,
      bodyY + 18
    );
    ctx.restore();
  }

  // 3. Bottom QR Code & Audio Listening Card (Pinned cleanly near bottom)
  const footerY = canvasHeight - footerBottomMargin - footerHeight;
  ctx.save();
  ctx.fillStyle = palette.cardElevated;
  ctx.beginPath();
  ctx.roundRect(padX, footerY, innerWidth, footerHeight, 20);
  ctx.fill();
  ctx.strokeStyle = palette.borderOuter;
  ctx.lineWidth = 2;
  ctx.stroke();

  const qrSize = 242;
  const qrX = padX + innerWidth - qrSize - 32;
  const qrY = footerY + Math.round((footerHeight - qrSize) / 2);

  const qrMatrix = encodeQrMatrix(opts.qrUrl);
  renderQrToCanvas(ctx, qrMatrix, {
    x: qrX,
    y: qrY,
    size: qrSize,
    darkColor: palette.qrDark,
    lightColor: '#ffffff',
    quietZoneModules: 3,
    cornerRadius: 14,
  });

  // Left text inside QR audio footer
  const leftX = padX + 34;
  const leftMaxW = qrX - leftX - 28;

  // Pill badge
  ctx.fillStyle = palette.vermilion;
  ctx.beginPath();
  ctx.roundRect(leftX, footerY + 34, 296, 40, 20);
  ctx.fill();
  ctx.fillStyle = '#fff8ee';
  ctx.font = `700 21px ${FONT_STACK_ZH_SANS}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('🎧 扫码直达 · 在线聆听梵音', leftX + 20, footerY + 55);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = palette.textPrimary;
  ctx.font = `700 32px ${FONT_STACK_ZH_SERIF}`;
  ctx.fillText('识别右侧二维码听诵本咒', leftX, footerY + 124, leftMaxW);

  ctx.fillStyle = palette.textSecondary;
  ctx.font = `500 23px ${FONT_STACK_ZH_SANS}`;
  ctx.fillText(
    `音源：${opts.modeLabelZh} · ${opts.voiceLabelZh}`,
    leftX,
    footerY + 168,
    leftMaxW
  );

  const scopeText =
    opts.selectedVerseIndices.length === 1
      ? `定位：第 ${String((opts.entry.verses[opts.selectedVerseIndices[0]]?.index ?? 1)).padStart(2, '0')} 句梵音跟读`
      : `定位：共选 ${opts.selectedVerseIndices.length} / ${opts.entry.verses.length} 句同步跟诵`;
  ctx.fillStyle = palette.gold;
  ctx.font = `600 22px ${FONT_STACK_ZH_SANS}`;
  ctx.fillText(scopeText, leftX, footerY + 208, leftMaxW);

  ctx.fillStyle = palette.textMuted;
  ctx.font = `500 20px ${FONT_STACK_ZH_SANS}`;
  ctx.fillText(
    '梵音宝典 · Sarva-Dhāraṇī-Kośa (12大梵典库精校)',
    leftX,
    footerY + 256,
    leftMaxW
  );
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('生成 PNG 图像数据失败'));
    }, 'image/png');
  });

  const safeTitle = opts.entry.titleZh
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .slice(0, 32);
  const fileName = `${safeTitle}_梵音分享卡_${opts.ratio === '3:4' ? '3x4' : '9x16'}.png`;

  return {
    blob,
    dataUrl,
    width: canvasWidth,
    height: canvasHeight,
    truncatedVerseCount,
    fileName,
  };
}
