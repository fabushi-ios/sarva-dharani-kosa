import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  iastToSiddham,
  iastToDevanagari,
  devanagariToIast,
  siddhamToIast,
  cleanEditorialIast,
} from '../../src/core/sanskrit/transliterator';
import { iastToSiddhamUnicode } from '../../src/core/transliterator';
import { analyzeSanskritProsody } from '../../src/core/sanskrit/prosody';
import { generateVerseChinesePhonetics } from '../../src/core/sanskrit/phoneticMapper';
import {
  CBETA_GAIJI_MAP,
  CBETA_AUTH_RECORDS,
} from '../../src/data/generated/cbetaAuthRecords';
import { AUTHORITATIVE_CBETA_RECORDS } from '../../src/data/kosa-generated/cbetaAuthRecords';
import {
  DB1_FANGSHAN_CORPUS,
  DB2_TAISHO_EXT_CORPUS,
} from '../../src/data/generated/tier1Databases';

/**
 * Exact 92 Siddhaṃ codepoints mapped in `public/fonts/NotoSansSiddham-Regular.woff2`
 * (`U+11580..U+115B5` and `U+115B8..U+115DD`, excluding reserved `U+115B6..U+115B7`) plus ASCII space.
 */
const NOTO_SANS_SIDDHAM_VALID_RE = /^[\u{11580}-\u{115B5}\u{115B8}-\u{115DD} ]+$/u;

describe('Siddhaṃ Unicode, Font Coverage & Corpus Philological Accuracy', () => {
  it('distinguishes Candrabindu (m̐ -> 𑖼 U+115BC) from Anusvāra (ṃ -> 𑖽 U+115BD) with zero U+0310 tofu leaks', () => {
    // Exact bug from screenshot: hūm̐ (h + ū + m + U+0310) previously emitted 𑖮𑖳𑖦𑖿\u0310 -> 𑖮𑖳□□□
    expect(iastToSiddham('hūm\u0310')).toBe('𑖮𑖳𑖼');
    expect(iastToSiddham('hū\u0310')).toBe('𑖮𑖳𑖼');
    expect(iastToSiddham('hūṃ\u0310')).toBe('𑖮𑖳𑖼');
    expect(iastToSiddham('hūm\u0310hūm\u0310 phaṭ phaṭ svāhā')).toBe('𑖮𑖳𑖼𑖮𑖳𑖼 𑖣𑖘𑖿 𑖣𑖘𑖿 𑖭𑖿𑖪𑖯𑖮𑖯');
    expect(iastToSiddham('hūm\u0310')).not.toContain('\u0310');

    // Standard Anusvāra (ṃ / ṁ) -> U+115BD (𑖽), Candrabindu (m̐) -> U+115BC (𑖼)
    expect(iastToSiddham('oṃ')).toBe('𑖌𑖽');
    expect(iastToSiddham('om\u0310')).toBe('𑖌𑖼');
    expect(iastToSiddham('namaḥ')).toBe('𑖡𑖦𑖾');

    // Prosody & Chinese phonetic mapping for hūm̐ / om̐ (prosodic Guru split: pad-me)
    const syllables = analyzeSanskritProsody('om\u0310 maṇipadme hūm\u0310');
    expect(syllables.map((s) => s.siddham)).toEqual(['𑖌𑖼', '𑖦', '𑖜𑖰', '𑖢𑖟𑖿', '𑖦𑖸', '𑖮𑖳𑖼']);
    const phon = generateVerseChinesePhonetics('om\u0310 maṇipadme hūm\u0310');
    expect(phon.classicalTranslitZh).toContain('吽');
  });

  it('encodes vocalic ḷ/ḹ matras per Unicode Standard Ch. 15 and normalizes loanword/DSBC orthography in both engines', () => {
    // Unicode Siddhaṃ reserves U+115B6..U+115B7; dependent ḷ/ḹ is Virāma + la + ṛ/ṝ matra
    expect(iastToSiddham('kḷpta')).toBe('𑖎𑖿𑖩𑖴𑖢𑖿𑖝');
    expect(iastToSiddham('kḹ')).toBe('𑖎𑖿𑖩𑖵');
    expect(siddhamToIast('𑖎𑖿𑖩𑖴𑖢𑖿𑖝')).toBe('kḷpta');

    // DSBC 'sfuṭa' (= sphuṭa) & Tibetan loan 'thötreng' must not collide with SLP1 codes (f=ṛ, w=ṭ, z=ṣ, q=ḍ, x=ḷ)
    expect(iastToSiddham('sfuṭa')).toBe('𑖭𑖿𑖣𑖲𑖘');
    expect(iastToSiddhamUnicode('sfuṭa')).toBe('𑖭𑖿𑖣𑖲𑖘');
    expect(iastToSiddham('thötreng')).toBe('𑖞𑖺𑖝𑖿𑖨𑖸𑖡𑖿𑖐𑖿');

    // Embedded Devanāgarī & Nepalese/Gilgit scribal repetition numeral '2'
    expect(devanagariToIast('नमः सर्वतथागतानाम्')).toBe('namaḥ sarvatathāgatānām');
    expect(cleanEditorialIast('giri 2 gamari 2 svāhā')).toBe('giri giri gamari gamari svāhā');
    expect(iastToDevanagari('om\u0310')).toBe('ॐ');
  });

  it('guarantees 100% valid NotoSansSiddham codepoints and zero English/rubric/JS leaks across all 2,482 entries (38,000+ verses)', () => {
    const corpusDir = path.resolve(process.cwd(), 'public', 'corpus');
    const shardFiles = ['shard-curated.json', 'shard-12db.json', 'shard-gretil.json'];

    let entryCount = 0;
    let verseCount = 0;
    const boilerplateRe =
      /\b(?:Based on|Input by|COPYRIGHT|Creative Commons|Final Rubric|Subject\(s\):|miniature|This text has been|All rights reserved|Permanent link)\b|https?:\/\/|\bfunction\s*\(|\$\(\s*["']/i;

    for (const file of shardFiles) {
      const entries = JSON.parse(fs.readFileSync(path.join(corpusDir, file), 'utf8'));
      for (const entry of entries) {
        entryCount++;
        expect(entry.verses.length, `Entry ${entry.id} has empty verses`).toBeGreaterThan(0);
        for (const verse of entry.verses) {
          verseCount++;
          const sidPrimary = iastToSiddham(verse.iast);
          const sidM1 = iastToSiddhamUnicode(verse.iast);

          expect(
            NOTO_SANS_SIDDHAM_VALID_RE.test(sidPrimary),
            `Invalid Siddhaṃ in ${entry.id}: "${verse.iast}" -> "${sidPrimary}"`
          ).toBe(true);
          expect(
            NOTO_SANS_SIDDHAM_VALID_RE.test(sidM1),
            `Invalid M1 Siddhaṃ in ${entry.id}: "${verse.iast}" -> "${sidM1}"`
          ).toBe(true);
          expect(
            boilerplateRe.test(verse.iast),
            `Editorial/English boilerplate leaked in ${entry.id}: "${verse.iast}"`
          ).toBe(false);
        }
      }
    }

    expect(entryCount).toBeGreaterThanOrEqual(2480);
    expect(verseCount).toBeGreaterThanOrEqual(16000);
  });

  it('guarantees 100% valid Siddhaṃ Unicode across CBETA Gaiji, 916 <cb:tt> alignments, and DB2 lexicon entries', () => {
    for (const [id, g] of Object.entries(CBETA_GAIJI_MAP)) {
      if (g.iast) {
        expect(
          NOTO_SANS_SIDDHAM_VALID_RE.test(g.siddhamUnicode),
          `CBETA_GAIJI_MAP[${id}] (${g.iast}) has invalid siddhamUnicode: "${g.siddhamUnicode}"`
        ).toBe(true);
      }
    }

    let ttTotal = 0;
    for (const rec of CBETA_AUTH_RECORDS) {
      for (const tt of rec.ttAlignments) {
        ttTotal++;
        expect(
          NOTO_SANS_SIDDHAM_VALID_RE.test(tt.siddhamUnicode),
          `${rec.taishoId} tt[${tt.index}] has invalid siddhamUnicode: "${tt.siddhamUnicode}"`
        ).toBe(true);
      }
    }
    expect(ttTotal).toBe(916);

    for (const rec of AUTHORITATIVE_CBETA_RECORDS) {
      for (const tok of rec.interlinearTokens) {
        expect(
          NOTO_SANS_SIDDHAM_VALID_RE.test(tok.siddham),
          `${rec.id} token (${tok.zh}) has invalid siddham: "${tok.siddham}"`
        ).toBe(true);
      }
    }

    for (const lex of DB2_TAISHO_EXT_CORPUS.lexiconEntries) {
      if (lex.siddhamUnicode || lex.iast || lex.siddhamRefs.length > 0) {
        expect(
          NOTO_SANS_SIDDHAM_VALID_RE.test(lex.siddhamUnicode),
          `DB2 lexicon ${lex.id} (${lex.headwordZh}) has non-Siddhaṃ siddhamUnicode: "${lex.siddhamUnicode}"`
        ).toBe(true);
      }
    }
  });

  it('restores authentic Fangshan Stone Canon DB1 texts including Mahāpratisarā (pF28p0053a1701) with zero Roll-1 overwrites', () => {
    expect(DB1_FANGSHAN_CORPUS.records.length).toBe(741);
    const uniqueChineseTexts = new Set(DB1_FANGSHAN_CORPUS.records.map((r) => r.plainChineseText)).size;
    expect(uniqueChineseTexts).toBeGreaterThanOrEqual(730);

    for (const r of DB1_FANGSHAN_CORPUS.records) {
      expect(r.plainChineseText).not.toMatch(/\[[^\]]+\]/);
    }

    // Verify screenshot entry: F28n1071 Roll 8 (0053a17) Mahāpratisarā Mūla-mantra (authentic 413-clause stone XML AST)
    // AND F27n1061 (full 445-clause Mahāpratisarā-Mahāvidyārājñī critical edition)
    const shard12Db = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'public', 'corpus', 'shard-12db.json'), 'utf8')
    );
    const mahapratisara = shard12Db.find(
      (e: { id: string }) => e.id === 'db1-fangshan-F28n1071_pF28p0053a1701'
    );
    expect(mahapratisara).toBeDefined();
    expect(mahapratisara.titleZh).toContain('普遍光明清淨熾盛如意寶印心無能勝大明王大隨求');
    expect(mahapratisara.verses.length).toBeGreaterThanOrEqual(400);
    const joinedZh = mahapratisara.verses.map((v: { classicalTranslitZh?: string }) => v.classicalTranslitZh || '').join('');
    const joinedIast = mahapratisara.verses.map((v: { iast: string }) => v.iast).join(' ');
    expect(joinedZh).toContain('曩莫薩嚩怛他');
    expect(joinedIast).toContain('vipulagarbhe');
    expect(joinedIast).toContain('vipulavimale');
    expect(joinedIast).toContain('vegavati');

    const mahapratisaraFull = shard12Db.find(
      (e: { id: string }) => e.id === 'db1-fangshan-F27n1061_pF27p0494a0301'
    );
    expect(mahapratisaraFull).toBeDefined();
    expect(mahapratisaraFull.verses).toHaveLength(445);
    expect(
      mahapratisaraFull.verses.map((v: { iast: string }) => v.iast).join(' ')
    ).toContain('mahāpratisarā');

    // Verify pF28p0141a2301 (一切如來秘密心廣聚光明無垢寶蓮花頂根本陁羅𡰱) exact Siddhaṃ & IAST alignment
    const padmosnisa = shard12Db.find(
      (e: { id: string }) => e.id === 'db1-fangshan-F28n1071_pF28p0141a2301'
    );
    expect(padmosnisa).toBeDefined();
    expect(padmosnisa.verses).toHaveLength(26);
    expect(padmosnisa.verses[5].iast).toBe('mahā padmoṣṇīṣa hṛdaya');
    expect(padmosnisa.verses[5].classicalTranslitZh).toBe('摩賀鉢納謨瑟抳灑紇㗚乃野');
    expect(iastToSiddham(padmosnisa.verses[5].iast)).toBe('𑖦𑖮𑖯 𑖢𑖟𑖿𑖦𑖺𑖬𑖿𑖜𑖱𑖬 𑖮𑖴𑖟𑖧');
    expect(iastToSiddham(padmosnisa.verses[11].iast)).toBe('𑖦𑖮𑖯 𑖨𑖫𑖿𑖦𑖰 𑖭𑖡𑖿𑖟𑖰𑖝𑖸');
    expect(iastToSiddham(padmosnisa.verses[17].iast)).toBe('𑖨𑖎𑖿𑖬𑖜 𑖦𑖜𑖿𑖚𑖩');
    expect(iastToSiddham(padmosnisa.verses[20].iast)).toBe(
      '𑖭𑖨𑖿𑖪𑖺𑖬𑖿𑖜𑖱𑖬𑖯𑖠𑖰𑖬𑖿𑖙𑖯𑖡𑖯𑖠𑖰𑖬𑖿𑖙𑖰𑖝'
    );
  });
});
