import { create } from 'zustand';
import type { DecryptedVaultItem } from '../../types';
import { vaultService } from './vault.service';

interface VaultState {
  items: DecryptedVaultItem[];
  selectedItemId: string | null;
  searchQuery: string;
  categoryFilter: 'all' | 'favorites' | 'login' | 'card' | 'note';
  selectedTagId: string | null;
  isLoading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  selectItem: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: 'all' | 'favorites' | 'login' | 'card' | 'note') => void;
  setSelectedTagId: (tagId: string | null) => void;
  addItem: (item: DecryptedVaultItem) => void;
  removeItem: (id: string) => void;
  updateItemInStore: (item: DecryptedVaultItem) => void;
}

export const useVaultStore = create<VaultState>((set) => ({
  items: [],
  selectedItemId: null,
  searchQuery: '',
  categoryFilter: 'all',
  selectedTagId: null,
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await vaultService.fetchItems();
      set({ items, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load vault items', isLoading: false });
    }
  },

  selectItem: (id: string | null) => set({ selectedItemId: id }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category, selectedTagId: null }),
  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),

  addItem: (item) => {
    set((state) => ({ items: [item, ...state.items], selectedItemId: item.id }));
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
    }));
  },

  updateItemInStore: (updatedItem) => {
    set((state) => ({
      items: state.items.map((i) => (i.id === updatedItem.id ? updatedItem : i)),
    }));
  },
}));
