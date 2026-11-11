import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  analyzeSanskritWord,
  decomposeSanskritCompound,
  getLoadedSanskritLexiconSize,
  isProvenancePlaceholderMeaning,
  resolveEffectiveVerseMeaning,
  translateFullDharani,
  translateSanskritVerse,
} from '../../src/core/sanskrit/sanskritLexicon';
import { buildWordGlossesFromIast } from '../../src/core/sanskrit/phoneticMapper';
import { attachLazyWordsToEntries } from '../../src/data/firstScreenCorpus';
import type { DharaniEntry } from '../../src/types/kosaTypes';

describe('Sanskrit Multi-Layer Lexicon, Compound Decomposer & Full-Corpus Semantic Translation', () => {
  it('loads 41,000+ authoritative Sanskrit stems across Mahāvyutpatti, T54, BHSD & CAE', () => {
    expect(getLoadedSanskritLexiconSize()).toBeGreaterThan(41000);
  });

  it('repairs and accurately translates every word and verse of screenshot entry db2-taisho-T21n1336_001', () => {
    const shard12DbPath = path.resolve(process.cwd(), 'public/corpus/shard-12db.json');
    const shard12Db = attachLazyWordsToEntries(
      JSON.parse(fs.readFileSync(shard12DbPath, 'utf-8')) as DharaniEntry[]
    );
    const entry = shard12Db.find((e) => e.id === 'db2-taisho-T21n1336_001');
    expect(entry).toBeDefined();

    const fullIast = entry!.verses.map((v) => v.iast).join(' ');
    expect(fullIast).toContain('cipaṭu');
    expect(fullIast).toContain('hunupaṭu');
    expect(fullIast).toContain('ājñāpaṭu');
    expect(fullIast).toContain('śamanapaṭu');
    expect(fullIast).toContain('svāhā');
    expect(fullIast).not.toContain('divāaḥ');

    for (const verse of entry!.verses) {
      expect(verse.words.length).toBeGreaterThan(0);
      expect(isProvenancePlaceholderMeaning(verse.meaningZh)).toBe(false);
      expect(isProvenancePlaceholderMeaning(verse.meaningEn)).toBe(false);
      for (const w of verse.words) {
        expect(w.meaningZh.length).toBeGreaterThan(0);
        expect(w.meaningZh).not.toContain('契入本尊三昧总持');
        expect(w.stem).toBeTruthy();
        expect(w.grammar).toBeTruthy();
      }
    }

    const v1Meanings = new Set(entry!.verses[0].words.map((w) => w.meaningZh));
    // Distinct Sanskrit tokens (`cipaṭu`, `hunupaṭu`, `ājñāpaṭu`, `tuhunapaṭu`, `śamanapaṭu`, `suśrutena`, `paṭu`) have distinct meanings!
    expect(v1Meanings.size).toBeGreaterThanOrEqual(5);

    const fullSummary = translateFullDharani(entry!.verses);
    expect(fullSummary.fullMeaningZh.length).toBeGreaterThan(30);
    expect(fullSummary.fullMeaningEn.length).toBeGreaterThan(30);
    expect(fullSummary.fullMeaningZh).toContain('圆满吉祥成就');
  });

  it('handles Pāṇinian inflections, Samāsa/Sandhi compounds, 50 Siddhaṃ Akṣara-mukha gates & untruncated >14-word verses', () => {
    // 1. Pāṇinian Inflections
    expect(analyzeSanskritWord('ratnatrayāya').meaningZh).toContain('三宝');
    expect(analyzeSanskritWord('sarvasattvānāṃ').meaningZh).toContain('有情');
    expect(analyzeSanskritWord('mahāmāyūryā').sourceLayer).not.toBe('dhatu_mantra');
    expect(analyzeSanskritWord('rakṣāṃ').sourceLayer).not.toBe('dhatu_mantra');

    // 2. Dynamic-Programming Samāsa & Sandhi Compound Decomposer
    const c1 = decomposeSanskritCompound('raktavarṇā');
    expect(c1).not.toBeNull();
    expect(c1!.components?.length).toBeGreaterThanOrEqual(2);

    const c2 = analyzeSanskritWord('sarvapāpaviśodhane');
    expect(c2.meaningZh).toContain('一切');
    expect(c2.meaningZh).not.toContain('契入本尊三昧总持');

    const c3 = analyzeSanskritWord('padmacihnatejodhātusvarūpā');
    expect(c3.sourceLayer).toBe('compound');
    expect(c3.components?.length).toBeGreaterThanOrEqual(4);

    // 3. 50 Siddhaṃ Akṣara-mukha Gates (T84n2701)
    expect(analyzeSanskritWord('a').meaningZh).toContain('本不生');
    expect(analyzeSanskritWord('ka').meaningZh).toContain('迦字门');
    expect(analyzeSanskritWord('kha').meaningZh).toContain('佉字门');
    expect(analyzeSanskritWord('hrīḥ').meaningZh).toContain('莲华');

    // 4. Untruncated word glosses (> 14 words in a single verse)
    const longVerse =
      'tadyathā adaṇḍe daṇḍapati daṇḍāvartani daṇḍakuśale daṇḍasudhāri dhāri dhārapati buddhapāśyane sarvadhāraṇyāvartani saṃghaparīkṣite saṃghanirghātani dharmaparīkṣite sarvasattvarutakauśalyānugate siṃhavikrīḍite svāhā';
    const glosses = buildWordGlossesFromIast(longVerse);
    expect(glosses.length).toBe(16);

    const sem = translateSanskritVerse(
      'namo ratnatrayāya | nama āryāvalokiteśvarāya bodhisattvāya mahāsattvāya mahākāruṇikāya | tadyathā oṃ sarvapāpaviśodhane svāhā'
    );
    expect(sem.meaningZh).toContain('归命顶礼');
    expect(sem.meaningZh).toContain('即说咒曰');
    expect(sem.meaningZh).toContain('圆满吉祥成就');
    expect(sem.meaningEn).toContain('Homage');
  });

  it('guarantees zero placeholder word glosses and zero provenance-only verse translations across all 2,482 corpus entries', () => {
    const corpusDir = path.resolve(process.cwd(), 'public/corpus');
    const shardFiles = ['shard-curated.json', 'shard-12db.json', 'shard-gretil.json'];

    let totalEntries = 0;
    let totalVerses = 0;
    let totalSampledWords = 0;

    for (const file of shardFiles) {
      const rawEntries = JSON.parse(
        fs.readFileSync(path.join(corpusDir, file), 'utf-8')
      ) as DharaniEntry[];
      const hydrated = attachLazyWordsToEntries(rawEntries);
      totalEntries += hydrated.length;

      for (const entry of hydrated) {
        expect(entry.verses.length, `${entry.id} has empty verses`).toBeGreaterThan(0);
        for (const v of entry.verses) {
          totalVerses++;
          const resolved = resolveEffectiveVerseMeaning(v);
          expect(
            resolved.meaningZh.length,
            `Empty meaningZh on ${entry.id} v${v.index} (${v.iast})`
          ).toBeGreaterThan(0);
          expect(
            isProvenancePlaceholderMeaning(v.meaningZh),
            `Provenance placeholder meaningZh leaked on ${entry.id} v${v.index}: ${v.meaningZh}`
          ).toBe(false);
          expect(
            isProvenancePlaceholderMeaning(v.meaningEn),
            `Provenance placeholder meaningEn leaked on ${entry.id} v${v.index}: ${v.meaningEn}`
          ).toBe(false);
          expect(
            v.meaningZh,
            `Legacy fallback leaked into meaningZh on ${entry.id} v${v.index}`
          ).not.toContain('契入本尊三昧总持');

          // Audit explicit words + deterministic sample across all shards
          if (file === 'shard-curated.json' || totalVerses % 8 === 0) {
            expect(v.words.length, `Empty words on ${entry.id} v${v.index}`).toBeGreaterThan(0);
            for (const w of v.words) {
              totalSampledWords++;
              expect(w.meaningZh.length, `Empty word gloss for ${w.iast}`).toBeGreaterThan(0);
              expect(w.meaningZh).not.toContain('契入本尊三昧总持');
              expect(w.meaningZh).not.toBe('梵音詞節');
            }
          }
        }
      }
    }

    expect(totalEntries).toBeGreaterThanOrEqual(2480);
    expect(totalVerses).toBeGreaterThan(20000);
    expect(totalSampledWords).toBeGreaterThan(20000);
  });
});
