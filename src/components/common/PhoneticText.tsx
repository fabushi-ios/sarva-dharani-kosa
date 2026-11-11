import React from 'react';
import { parsePhoneticRichSegments } from '../../core/sanskrit/phoneticMapper';

interface PhoneticTextProps {
  text: string;
}

/**
 * Renders modern Sino-Sanskrit phonetic notation with scholarly Śikṣā typography:
 * - Vowelless sub-syllabic segments (`₍赫₎` Visarga -ḥ, `₍尔₎` Virāma coda, `₍斯₎` conjunct onset)
 *   are rendered as typographic subscripts `<sub className="phon-sub">赫</sub>` without visible brackets.
 * - Optional parenthesized `(iast)` annotations are styled cleanly with `--font-iast`.
 */
export const PhoneticText: React.FC<PhoneticTextProps> = ({ text }) => {
  if (!text) return null;
  if (!text.includes('₍') && !text.includes('(')) {
    return <>{text}</>;
  }

  const segments = parsePhoneticRichSegments(text);
  return (
    <>
      {segments.map((seg, idx) => {
        if (seg.kind === 'sub') {
          return (
            <sub key={idx} className="phon-sub">
              {seg.text}
            </sub>
          );
        }
        if (seg.kind === 'iast') {
          return (
            <span key={idx} className="phon-iast-paren">
              {seg.text}
            </span>
          );
        }
        return <React.Fragment key={idx}>{seg.text}</React.Fragment>;
      })}
    </>
  );
};
