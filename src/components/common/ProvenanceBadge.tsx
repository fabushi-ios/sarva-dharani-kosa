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
  /** Optional custom tooltip override */
  customTooltip?: string;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  state,
  field,
  compact = false,
  customLabel,
  customTooltip,
}) => {
  const tooltip =
    customTooltip ||
    (field ? getFieldProvenanceTooltip(field, state) : undefined) ||
    (state === 'db-original'
      ? '【库藏原文】此项为原数据库固有内容，系统完整保留原文。'
      : state === 'mixed'
      ? '【原载+参考】含数据库原载内容及系统自动补全参考项。'
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
