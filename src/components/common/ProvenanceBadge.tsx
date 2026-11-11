import React from 'react';
import type { VerseTrackableField } from '../../types/kosaTypes';
import {
  getFieldProvenanceTooltip,
  type EntryFieldOriginState,
} from '../../core/provenance/fieldProvenance';

interface ProvenanceBadgeProps {
  state: EntryFieldOriginState;
  field?: VerseTrackableField;
  /** Compact mode for narrow 96px script-label columns or mini word cards */
  compact?: boolean;
  /** Optional custom label override */
  customLabel?: string;
  /** Optional explicit left/right labels for mixed state */
  mixedOrigLabel?: string;
  mixedRefLabel?: string;
  /** Optional custom tooltip override */
  customTooltip?: string;
}

function splitMixedLabelParts(
  label: string | undefined,
  compact: boolean,
  mixedOrigLabel?: string,
  mixedRefLabel?: string
): { origPart: string; refPart: string } {
  if (mixedOrigLabel && mixedRefLabel) {
    return { origPart: mixedOrigLabel, refPart: mixedRefLabel };
  }
  if (label && label.includes('+')) {
    const cleaned = label.replace(/^[◐●◇\s]+/, '').trim();
    const plusIdx = cleaned.indexOf('+');
    if (plusIdx > 0) {
      const left = cleaned.slice(0, plusIdx).trim();
      const right = cleaned.slice(plusIdx + 1).trim().replace(/^[◇\s]+/, '');
      return {
        origPart: left.startsWith('●') ? left : `● ${left}`,
        refPart: right.startsWith('◇') ? right : `◇ ${right}`,
      };
    }
  }
  return {
    origPart: '● 原载',
    refPart: compact ? '◇ 参考' : '◇ 补全参考',
  };
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  state,
  field,
  compact = false,
  customLabel,
  mixedOrigLabel,
  mixedRefLabel,
  customTooltip,
}) => {
  const tooltip =
    customTooltip ||
    (field ? getFieldProvenanceTooltip(field, state) : undefined) ||
    (state === 'db-original'
      ? '【库藏原文】此项为原数据库固有内容，系统完整保留原文。'
      : state === 'mixed'
      ? '【原载+参考】朱砂红字为原数据库固有内容（原载），青金蓝字为系统推导补全内容（参考）。'
      : '【处理参考】原数据库无此项，由系统据数据库原文处理推导生成，仅供参考。');

  const defaultLabel =
    state === 'db-original'
      ? compact
        ? '● 原典原载'
        : '● 库藏原文'
      : state === 'mixed'
      ? compact
        ? '◐ 原载+参考'
        : '◐ 原载+补全参考'
      : compact
      ? '◇ 处理参考'
      : '◇ 处理生成·参考';

  const variantClass =
    state === 'db-original'
      ? 'is-original'
      : state === 'mixed'
      ? 'is-mixed'
      : 'is-reference';

  if (state === 'mixed') {
    const { origPart, refPart } = splitMixedLabelParts(
      customLabel,
      compact,
      mixedOrigLabel,
      mixedRefLabel
    );
    return (
      <span
        className={`prov-origin-badge ${variantClass} ${compact ? 'is-compact' : ''}`}
        title={tooltip}
        data-origin={state}
      >
        <span className="prov-part-orig">{origPart}</span>
        <span className="prov-part-sep">+</span>
        <span className="prov-part-ref">{refPart}</span>
      </span>
    );
  }

  return (
    <span
      className={`prov-origin-badge ${variantClass} ${compact ? 'is-compact' : ''}`}
      title={tooltip}
      data-origin={state}
    >
      {customLabel || defaultLabel}
    </span>
  );
};

