/**
 * Authoritative Canonical Source Inspector Modal (`src/components/AuthoritativeSourceModal.tsx`)
 * Displays raw CBETA TEI-P5 XML excerpts, GRETIL manuscript edition headers,
 * scholarly citations, and direct links to the canonical open-source repositories.
 */

import React from 'react';
import { DharaniEntry } from '../types/dharani';

interface AuthoritativeSourceModalProps {
  entry: DharaniEntry | null;
  onClose: () => void;
}

export const AuthoritativeSourceModal: React.FC<AuthoritativeSourceModalProps> = ({
  entry,
  onClose,
}) => {
  if (!entry) return null;
  const meta = entry.sourceMetadata;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-amber-600/40 bg-stone-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-stone-800 pb-4">
          <div>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
              权威开源佛典文献溯源核验 (Authoritative Provenance Inspector)
            </span>
            <h3 className="mt-1.5 font-serif-cn text-xl font-bold text-stone-100">
              {entry.titleZh} ({entry.titleSanskrit})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700"
          >
            ✕ 关闭
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="grid gap-3 rounded-xl border border-stone-800 bg-stone-950/70 p-4 sm:grid-cols-2">
            <div>
              <div className="text-stone-400">CBETA 大正藏编号</div>
              <div className="mt-0.5 font-mono text-sm font-bold text-amber-300">
                {meta.taishoId} ({meta.cbetaXmlId})
              </div>
            </div>
            <div>
              <div className="text-stone-400">历史译者 / 梵本校勘学者</div>
              <div className="mt-0.5 font-medium text-stone-200">
                {meta.dynasty} · {meta.translator}
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-stone-400">梵文贝叶经学术底本引用 (Sanskrit Edition Citation)</div>
              <div className="mt-0.5 font-mono text-emerald-300">
                {meta.sanskritEditionCitation}
              </div>
            </div>
          </div>

          {/* Tang Phonetic Notes */}
          <div>
            <h4 className="mb-1.5 font-semibold text-amber-300">
              唐代悉昙音韵夹注 (`&lt;cb:yin&gt;&lt;cb:sg&gt;` / `&lt;note place="inline"&gt;`)
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {meta.tangPhoneticNotes.map((note, idx) => (
                <span
                  key={idx}
                  className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-2.5 py-1 text-amber-200"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>

          {/* Raw CBETA XML Excerpt */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-semibold text-stone-300">
                CBETA TEI-P5 原始 XML 节点快照
              </span>
              <a
                href={meta.cbetaRawUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline"
              >
                直达 cbeta-org/xml-p5 源文件 ↗
              </a>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-950 p-3 font-mono text-[11px] leading-relaxed text-amber-200">
              {meta.rawXmlExcerpt}
            </pre>
          </div>

          {/* Raw GRETIL Excerpt if available */}
          {meta.rawGretilExcerpt && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-semibold text-stone-300">
                  德国哥廷根大学 GRETIL 梵文校勘本快照 ({meta.gretilId})
                </span>
                {meta.gretilRawUrl && (
                  <a
                    href={meta.gretilRawUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline"
                  >
                    直达 INDOLOGY/GRETIL-mirror 源文件 ↗
                  </a>
                )}
              </div>
              <pre className="overflow-x-auto rounded-xl border border-stone-800 bg-stone-950 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
                {meta.rawGretilExcerpt}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthoritativeSourceModal;
