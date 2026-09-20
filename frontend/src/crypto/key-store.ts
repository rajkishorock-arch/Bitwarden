/**
 * In-Memory Key Store & Lock State Manager
 * The Master Encryption Key (MEK) resides ONLY in application RAM while unlocked.
 * Zero persistent storage (no localStorage, sessionStorage, or IndexedDB).
 */

import { create } from 'zustand';
import type { CryptoLockState } from './crypto.types';
import { useVaultStore } from '../features/vault/vault.store';

interface CryptoState {
  mek: CryptoKey | null;
  lockState: CryptoLockState;
  isUnlocked: boolean;
  autoLockMinutes: number;
  lastActivityTimestamp: number;

  setMasterEncryptionKey: (key: CryptoKey) => void;
  setLockState: (state: CryptoLockState) => void;
  lockVault: () => void;
  updateActivity: () => void;
  setAutoLockMinutes: (minutes: number) => void;
}

export const useCryptoStore = create<CryptoState>((set, get) => ({
  mek: null,
  lockState: 'LOCKED',
  isUnlocked: false,
  autoLockMinutes: 5,
  lastActivityTimestamp: Date.now(),

  setMasterEncryptionKey: (key: CryptoKey) => {
    set({
      mek: key,
      isUnlocked: true,
      lockState: 'UNLOCKED',
      lastActivityTimestamp: Date.now(),
    });
  },

  setLockState: (state: CryptoLockState) => {
    set({ lockState: state });
  },

  lockVault: () => {
    useVaultStore.getState().clearVaultState();
    set({
      mek: null,
      isUnlocked: false,
      lockState: 'LOCKED',
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
