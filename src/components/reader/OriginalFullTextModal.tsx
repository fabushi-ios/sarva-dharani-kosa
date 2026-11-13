/**
 * src/components/reader/OriginalFullTextModal.tsx
 *
 * Full-screen modal wrapper around `InlineOriginalTextPanel` so every database (DB1–DB12,
 * CBETA Full Canon, GRETIL/DSBC) shares the exact same multi-protocol original full-text reader.
 */
import React from 'react';
import { X, BookOpen } from 'lucide-react';
import type { DharaniEntry } from '../../types/kosaTypes';
import { InlineOriginalTextPanel } from './InlineOriginalTextPanel';

interface OriginalFullTextModalProps {
  entry: DharaniEntry;
  onClose: () => void;
}

export const OriginalFullTextModal: React.FC<OriginalFullTextModalProps> = ({ entry, onClose }) => {
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card fulltext-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <BookOpen size={20} color="var(--accent-vermilion)" />
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700 }}>原文全文 · {entry.titleZh}</h3>
          </div>
          <button
            id="close-fulltext-modal-btn"
            type="button"
            className="btn-scholarly"
            onClick={onClose}
          >
            <X size={16} />
            <span>关闭</span>
          </button>
        </div>

        <div className="modal-body">
          <InlineOriginalTextPanel entry={entry} mode="modal" />
        </div>
      </div>
    </div>
  );
};
