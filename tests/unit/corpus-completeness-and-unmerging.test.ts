import { describe, expect, it } from 'vitest';
import { BUILTIN_DHARANI_CORPUS } from '../../src/data';
import { MAJOR_DHARANIS } from '../../src/data/kosa-corpus/major-dharanis';
import { TEN_SMALL_DHARANIS } from '../../src/data/kosa-corpus/ten-small-dharanis';
import { BUDDHAS_AND_PROTECTORS_DHARANIS } from '../../src/data/kosa-corpus/buddhas-bodhisattvas';
import { EXPANDED_FAMOUS_DHARANIS } from '../../src/data/kosa-corpus/expanded-famous-dharanis';
import { WORLD_ENCYCLOPEDIA_DHARANIS } from '../../src/data/kosa-corpus/world-mantras-encyclopedia';
import { DB2_TAISHO_EXT_CORPUS } from '../../src/data/generated/tier1Databases';
import {
  getSearchSuggestions,
  hydrateTaishoSearchIndex,
  normalizeSearchText,
} from '../../src/core/search/searchEngine';
import { TAISHO_MIKKYO_FILE_INDEX } from '../../src/data/kosa-generated/taishoMikkyoIndex';
import { reconstructIastFromChineseTranslit } from '../../src/services/cbeta/cbetaLiveService';

describe('Root-Cause Fixes: Complete Clause Counts, Anti-Merging ("一咒一篇"), and 帝天神咒 Search', () => {
  it('restores exact canonical clause counts for Great Compassion (84), Uṣṇīṣavijayā (35), Kāraṇḍamudrā (40), and Śūraṅgama (427)', () => {
    const byId = new Map(BUILTIN_DHARANI_CORPUS.map((e) => [e.id, e]));

    // 1. Great Compassion Dhāraṇī (大悲咒全本): exact 84 clauses
    const nilakantha = byId.get('nilakantha-mahakaruna-dharani')!;
    expect(nilakantha).toBeDefined();
    expect(nilakantha.verses.length).toBe(84);
    // Chinese is the CBETA T20n1060 wording itself (applyCuratedCanon), verse by verse.
    expect(nilakantha.verses[0].classicalTranslitZh).toContain('南無喝囉怛那哆囉夜');
    expect(nilakantha.verses[83].classicalTranslitZh).toContain('娑婆訶');
    expect(nilakantha.verses[0].fieldSources?.siddham).toBe('db-original');
    expect(nilakantha.verses[0].siddhamOriginal).toBeTruthy();

    // 2. Uṣṇīṣavijayā Dhāraṇī (佛顶尊胜陀罗尼): exact 35 clauses
    const usnisa = byId.get('usnisavijaya-dharani')!;
    expect(usnisa).toBeDefined();
    expect(usnisa.verses.length).toBe(35);

    // 3. Kāraṇḍamudrā Dhāraṇī (宝箧印陀罗尼): exact 40 clauses matching T19n1022A inline numbers 1..40
    const karanda = byId.get('karandamudra-dharani')!;
    expect(karanda).toBeDefined();
    expect(karanda.verses.length).toBe(40);

    // 4. Śūraṅgama Sitātapatrā Dhāraṇī (大佛顶首楞严神咒五会全本): exact 427 clauses & full 2,620 chars
    const shurangama = byId.get('shurangama-sitatapatra-hrdaya')!;
    expect(shurangama).toBeDefined();
    expect(shurangama.verses.length).toBe(427);
    const totalZhChars = shurangama.verses
      .map((v) => (v.classicalTranslitZh || '').replace(/[^\u3400-\u9FFF\u{20000}-\u{2EBE0}]/gu, ''))
      .join('').length;
    expect(totalZhChars).toBeGreaterThanOrEqual(2600);

    // 5. Un-merged Komyo Shingon (2 clauses) & Vajrasattva 100-Syllable Mantra (10 clauses)
    expect(byId.get('amoghapasa-vairocana-mahamudra')!.verses.length).toBe(2);
    expect(byId.get('vajrasattva-100-syllable')!.verses.length).toBe(10);

    // 6. Restored Vajravidāraṇā (18 clauses), GRETIL Grahamātṛkā (35 clauses), & OCHS Mantrakoṣa (69 verses, no .slice(0, 8))
    expect(byId.get('vajravidarana-dharani')!.verses.length).toBe(18);
    const grahamatrka = BUILTIN_DHARANI_CORPUS.find((e) =>
      e.provenance.gretilFile === 'grahmdhu.htm'
    );
    expect(grahamatrka).toBeDefined();
    expect(grahamatrka!.verses.length).toBe(35);

    const ochsMantrakosa = byId.get('db12-ochs-ochs_000_000_259_mantrakosa')!;
    expect(ochsMantrakosa.verses.length).toBe(69);
  });

  it('eliminates all "..." / "…" truncations and omnibus bundled entries across all curated modules', () => {
    const curatedEntries = [
      ...MAJOR_DHARANIS,
      ...TEN_SMALL_DHARANIS,
      ...BUDDHAS_AND_PROTECTORS_DHARANIS,
      ...EXPANDED_FAMOUS_DHARANIS,
      ...WORLD_ENCYCLOPEDIA_DHARANIS,
    ];

    const omnibusTitleRe = /总集|全集|大全|合集|总汇/;
    const ellipsisRe = /\.\.\.|…/;

    for (const entry of curatedEntries) {
      expect(
        omnibusTitleRe.test(entry.titleZh),
        `Found bundled omnibus title in curated entry ${entry.id}: ${entry.titleZh}`
      ).toBe(false);

      for (const verse of entry.verses) {
        expect(
          ellipsisRe.test(verse.iast),
          `Found ellipsis truncation in ${entry.id}/${verse.id} iast: ${verse.iast}`
        ).toBe(false);
        expect(
          ellipsisRe.test(verse.classicalTranslitZh || ''),
          `Found ellipsis truncation in ${entry.id}/${verse.id} classicalTranslitZh`
        ).toBe(false);
      }
    }

    // DB2 ancientDharanis must have zero bare-digit titles ("2", "3", etc.) and zero "合十五首"
    for (const rec of DB2_TAISHO_EXT_CORPUS.ancientDharanis) {
      expect(/^\d+$/.test(rec.dharaniTitle.trim())).toBe(false);
      expect(rec.dharaniTitle).not.toContain('合十五首');
    }

    // Multi-mantra sutras in DB4 & DB10 are un-merged into standalone entries (-m2, -m3...)
    const ids = new Set(BUILTIN_DHARANI_CORPUS.map((e) => e.id));
    expect(ids.has('db4-84000-UT22084-091-057-1')).toBe(true);
    expect(ids.has('db4-84000-UT22084-091-057-1-m2')).toBe(true);
    expect(ids.has('db4-84000-UT22084-090-008-1-m2')).toBe(true);
    expect(ids.has('db10-nibs-ms-SA00016.001')).toBe(true);
    expect(ids.has('db10-nibs-ms-SA00016.001-m2')).toBe(true);
  });

  it('generic search: every Taishō scripture is found by its title and by its own dhāraṇī text as a user would paste it', () => {
    hydrateTaishoSearchIndex(TAISHO_MIKKYO_FILE_INDEX);
    const misses: string[] = [];
    for (const ts of TAISHO_MIKKYO_FILE_INDEX) {
      const probes = [ts.titleTrad, ...ts.sampleDharanis.map((d) => Array.from(d).slice(0, 40).join('').replace(/[[(（][^\])）]*$/, ''))];
      for (const probe of probes) {
        if (!probe || Array.from(probe).length < 4) continue;
        const ids = getSearchSuggestions(BUILTIN_DHARANI_CORPUS, probe, 200)
          .filter((h) => h.kind === 'taisho-scripture')
          .map((h) => h.taishoScriptureId);
        if (!ids.includes(ts.id)) misses.push(`${ts.id}: ${probe}`);
      }
    }
    expect(misses.slice(0, 10), `${misses.length} misses`).toEqual([]);
  }, 300_000);

  it('the 坚牢地天 long mantra pasted with clause numbers and simplified/variant characters finds T21n1286', () => {
    hydrateTaishoSearchIndex(TAISHO_MIKKYO_FILE_INDEX);
    const pasted =
      '曩莫三曼多母驮南(一)唵(二)钵罗(二合)婆(三)啰怛你(四)设哩三曼多(五)阿驮阿驮(六)阿豆阿豆(七)比里底毗比里底毗曳(八)莎诃';
    const ids = getSearchSuggestions(BUILTIN_DHARANI_CORPUS, pasted, 40)
      .filter((h) => h.kind === 'taisho-scripture')
      .map((h) => h.taishoScriptureId);
    expect(ids).toContain('T21n1286');
    // No hand-written stand-in entries exist.
    const ids2 = new Set(BUILTIN_DHARANI_CORPUS.map((e) => e.id));
    expect(ids2.has('prthivi-devi-dharani')).toBe(false);
  });

  it('normalisation is generic: Traditional/Simplified/variant spellings and romanisations coincide', () => {
    expect(normalizeSearchText('地天陁羅尼')).toBe(normalizeSearchText('地天陀罗尼'));
    expect(normalizeSearchText('囉怛儞')).toBe(normalizeSearchText('啰怛你'));
    expect(normalizeSearchText('堅牢地天儀軌')).toBe(normalizeSearchText('坚牢地天仪轨'));
    expect(normalizeSearchText('鉢羅(二合)婆(三)')).toBe(normalizeSearchText('钵罗婆'));
    expect(normalizeSearchText('om shree swaha')).toBe(normalizeSearchText('oṃ śrī svāhā'));

    // 3. CBETA live service phonetic reconstructor never emits generic fake fallback
    const recon = reconstructIastFromChineseTranslit('南無三滿多沒馱喃 唵 鉢囉婆囉怛尼 娑嚩賀');
    expect(recon).toContain('oṃ');
    expect(recon).toContain('svāhā');
    expect(recon).not.toContain('sarva-tathāgata-hṛdaya-dhāraṇī');
  });
});
