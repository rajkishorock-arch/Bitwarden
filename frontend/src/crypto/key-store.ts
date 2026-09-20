/**
 * In-Memory Key Store & Lock Manager
 * The Master Encryption Key resides ONLY in memory and is NEVER saved to storage.
 */

import { create } from 'zustand';

interface CryptoState {
  mek: CryptoKey | null;
  isUnlocked: boolean;
  autoLockMinutes: number;
  lastActivityTimestamp: number;
  setMasterEncryptionKey: (key: CryptoKey) => void;
  lockVault: () => void;
  updateActivity: () => void;
  setAutoLockMinutes: (minutes: number) => void;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  mek: null,
  isUnlocked: false,
  autoLockMinutes: 5,
  lastActivityTimestamp: Date.now(),

  setMasterEncryptionKey: (key: CryptoKey) => {
    set({
      mek: key,
      isUnlocked: true,
      lastActivityTimestamp: Date.now(),
    });
  },

  lockVault: () => {
    set({
      mek: null,
      isUnlocked: false,
    });
  },

  updateActivity: () => {
    const { isUnlocked } = get();
    if (isUnlocked) {
      set({ lastActivityTimestamp: Date.now() });
    }
  },

  setAutoLockMinutes: (minutes: number) => {
    set({ autoLockMinutes: minutes });
  },
}));
