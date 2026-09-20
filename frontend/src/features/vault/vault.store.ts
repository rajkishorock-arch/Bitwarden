/**
 * In-Memory Vault Store
 * Holds decrypted vault records strictly in RAM while unlocked.
 * Zero persistence middleware (no localStorage/sessionStorage).
 */

import { create } from 'zustand';
import type {
  VaultItemDecrypted,
  CreateVaultItemInput,
  UpdateVaultItemInput,
} from './vault.types';
import { vaultService } from './vault.service';

export type CategoryFilter = 'all' | 'favorites' | 'logins' | 'cards' | 'notes';

interface VaultStoreState {
  items: VaultItemDecrypted[];
  isLoading: boolean;
  error: string | null;
  activeCategory: CategoryFilter;
  searchQuery: string;
  selectedItemId: string | null;

  setActiveCategory: (category: CategoryFilter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedItemId: (id: string | null) => void;

  fetchItems: (key: CryptoKey) => Promise<void>;
  createItem: (input: CreateVaultItemInput, key: CryptoKey) => Promise<VaultItemDecrypted>;
  updateItem: (id: string, input: UpdateVaultItemInput, key: CryptoKey) => Promise<VaultItemDecrypted>;
  deleteItem: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;

  clearVaultState: () => void;
}

export const useVaultStore = create<VaultStoreState>((set) => ({
  items: [],
  isLoading: false,
  error: null,
  activeCategory: 'all',
  searchQuery: '',
  selectedItemId: null,

  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedItemId: (id) => set({ selectedItemId: id }),

  fetchItems: async (key: CryptoKey) => {
    set({ isLoading: true, error: null });
    try {
      const items = await vaultService.fetchVaultItems(key);
      set({ items, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch vault items.', isLoading: false });
    }
  },

  createItem: async (input: CreateVaultItemInput, key: CryptoKey) => {
    set({ isLoading: true, error: null });
    try {
      const newItem = await vaultService.createVaultItem(input, key);
      set((state) => ({
        items: [newItem, ...state.items],
        isLoading: false,
      }));
      return newItem;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to create vault item.', isLoading: false });
      throw err;
    }
  },

  updateItem: async (id: string, input: UpdateVaultItemInput, key: CryptoKey) => {
    set({ isLoading: true, error: null });
    try {
      const updatedItem = await vaultService.updateVaultItem(id, input, key);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updatedItem : item)),
        isLoading: false,
      }));
      return updatedItem;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to update vault item.', isLoading: false });
      throw err;
    }
  },

  deleteItem: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await vaultService.deleteVaultItem(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err?.message || 'Failed to delete vault item.', isLoading: false });
      throw err;
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      await vaultService.toggleFavorite(id);
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? { ...item, is_favorite: !item.is_favorite } : item
        ),
      }));
    } catch (err: any) {
      set({ error: err?.message || 'Failed to toggle favorite.' });
    }
  },

  clearVaultState: () => {
    set({
      items: [],
      isLoading: false,
      error: null,
      selectedItemId: null,
      searchQuery: '',
      activeCategory: 'all',
    });
  },
}));
