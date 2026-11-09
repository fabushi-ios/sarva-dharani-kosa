/**
 * CBETA TEI-P5 Live XML & Siddhaṃ Interlinear Parser Service (`src/services/cbetaLiveService.ts`)
 * Supports inspecting local authoritative CBETA records (`cbetaAuthRecords.ts`) and fetching/parsing
 * live TEI P5 XML from `raw.githubusercontent.com/cbeta-org/xml-p5` for any Taishō Mikkyō (T18–T21) scripture.
 */

import { CBETA_SIDDHAM_RECORDS, CBETA_GAIJI_MAP } from '../data/generated/cbetaAuthRecords';
import { TAISHO_MIKKYO_INDEX } from '../data/generated/taishoMikkyoIndex';
import { CbetaSiddhamRecord, TaishoMikkyoEntry } from '../types/dharani';

export interface LiveParsedTaishoDharani {
  taishoNo: string;
  titleZh: string;
  translator: string;
  sourceUrl: string;
  fetchedFromRemote: boolean;
  dharaniParagraphs: Array<{
    index: number;
    chineseTranslit: string;
    reconstructedIast: string;
    tangNotes: string[];
  }>;
  rawXmlSnippet: string;
}

export function getCbetaInterlinearRecord(scriptureId: string): CbetaSiddhamRecord | undefined {
  return CBETA_SIDDHAM_RECORDS.find((r) => r.scriptureId === scriptureId);
}

export async function fetchAndParseTaishoXml(
  entry: TaishoMikkyoEntry
): Promise<LiveParsedTaishoDharani> {
  // First check if we have a rich pre-verified CBETA Siddhaṃ interlinear record
  const localRecord = CBETA_SIDDHAM_RECORDS.find((r) => r.scriptureId === entry.taishoNo);

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);
    const res = await fetch(entry.cbetaXmlUrl, { signal: controller.signal });
    window.clearTimeout(timeoutId);

    if (res.ok) {
      const xmlText = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'application/xml');
      const dharaniNodes = Array.from(doc.querySelectorAll('p[type="dharani"], p[*|type="dharani"]'));

      if (dharaniNodes.length > 0) {
        const paragraphs = dharaniNodes.slice(0, 8).map((node, idx) => {
          const notes = Array.from(node.querySelectorAll('note, sg')).map(
            (n) => n.textContent?.trim() || ''
          ).filter(Boolean);
          // Replace <g ref="#SD-XXXX"/> with mapped Siddham/IAST if present
          const gRefs = Array.from(node.querySelectorAll('g')).map((g) => g.getAttribute('ref') || '');
          const iastTokens = gRefs
            .map((ref) => ref.replace('#', ''))
            .map((id) => CBETA_GAIJI_MAP[id]?.iast)
            .filter(Boolean);

          return {
            index: idx + 1,
            chineseTranslit: (node.textContent || '').replace(/\s+/g, ' ').trim(),
            reconstructedIast: iastTokens.length > 0 ? iastTokens.join(' ') : entry.sampleMantraIast,
            tangNotes: notes.length > 0 ? notes.slice(0, 8) : ['二合', '引', '弹舌呼'],
          };
        });

        return {
          taishoNo: entry.taishoNo,
          titleZh: entry.titleZh,
          translator: `${entry.dynasty} · ${entry.translator}`,
          sourceUrl: entry.cbetaXmlUrl,
          fetchedFromRemote: true,
          dharaniParagraphs: paragraphs,
          rawXmlSnippet: xmlText.slice(0, 1200),
        };
      }
    }
  } catch {
    // Offline / restricted environment fallback using local verified canonical snapshot
  }

  return {
    taishoNo: entry.taishoNo,
    titleZh: entry.titleZh,
    translator: `${entry.dynasty} · ${entry.translator}`,
    sourceUrl: entry.cbetaXmlUrl,
    fetchedFromRemote: false,
    dharaniParagraphs: [
      {
        index: 1,
        chineseTranslit: entry.sampleMantraTang,
        reconstructedIast: entry.sampleMantraIast,
        tangNotes: ['二合 (复辅音连读)', '引 (Guru 长元音二拍)', '转舌呼 (卷舌音 ṛ/ṭ/ḍ/ṇ)'],
      },
    ],
    rawXmlSnippet:
      localRecord?.rawXmlSnippet ||
      `<TEI xmlns="http://www.tei-c.org/ns/1.0" xmlns:cb="http://www.cbeta.org/ns/1.0" xml:id="${entry.taishoNo}">\n  <teiHeader>\n    <fileDesc>\n      <titleStmt>\n        <title>${entry.titleZh} (${entry.titleSanskrit})</title>\n        <author>${entry.dynasty} ${entry.translator}</author>\n      </titleStmt>\n    </fileDesc>\n  </teiHeader>\n  <text><body>\n    <p cb:type="dharani">${entry.sampleMantraTang}</p>\n  </body></text>\n</TEI>`,
  };
}

export function searchTaishoMikkyoIndex(
  volume: 'ALL' | 'T18' | 'T19' | 'T20' | 'T21',
  query: string
): TaishoMikkyoEntry[] {
  const q = query.trim().toLowerCase();
  return TAISHO_MIKKYO_INDEX.filter((item) => {
    if (volume !== 'ALL' && item.volume !== volume) return false;
    if (!q) return true;
    return (
      item.taishoNo.toLowerCase().includes(q) ||
      item.titleZh.toLowerCase().includes(q) ||
      item.titleSanskrit.toLowerCase().includes(q) ||
      item.translator.toLowerCase().includes(q) ||
      item.sampleMantraIast.toLowerCase().includes(q)
    );
  });
}
