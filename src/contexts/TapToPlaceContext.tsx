import React, { createContext, useContext, useState, useCallback } from 'react';
import type { BlockType } from '../core/types';

// ── Context Interface ───────────────────────────────────────────────

export interface TapToPlaceContextValue {
  selectedBlock: BlockType | null;
  selectBlock: (blockType: BlockType) => void;
  deselectBlock: () => void;
  announcement: string;
  setAnnouncement: (message: string) => void;
}

const TapToPlaceContext = createContext<TapToPlaceContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────

export function TapToPlaceProvider({ children }: { children: React.ReactNode }) {
  const [selectedBlock, setSelectedBlock] = useState<BlockType | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const selectBlock = useCallback((blockType: BlockType) => {
    setSelectedBlock(blockType);
  }, []);

  const deselectBlock = useCallback(() => {
    setSelectedBlock(null);
  }, []);

  return (
    <TapToPlaceContext.Provider
      value={{ selectedBlock, selectBlock, deselectBlock, announcement, setAnnouncement }}
    >
      {children}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </TapToPlaceContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────

export function useTapToPlace(): TapToPlaceContextValue {
  const ctx = useContext(TapToPlaceContext);
  if (!ctx) throw new Error('useTapToPlace must be used within TapToPlaceProvider');
  return ctx;
}
