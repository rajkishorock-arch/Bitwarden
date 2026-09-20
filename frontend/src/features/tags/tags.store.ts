import { create } from 'zustand';
import type { Tag, CreateTagInput, UpdateTagInput } from './tags.types';
import { tagsService } from './tags.service';

interface TagsState {
  tags: Tag[];
  isLoading: boolean;
  error: string | null;

  fetchTags: () => Promise<void>;
  createTag: (input: CreateTagInput) => Promise<Tag>;
  updateTag: (id: string, input: UpdateTagInput) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  clearTagsState: () => void;
}

export const useTagsStore = create<TagsState>((set) => ({
  tags: [],
  isLoading: false,
  error: null,

  fetchTags: async () => {
    set({ isLoading: true, error: null });
    try {
      const tags = await tagsService.fetchTags();
      set({ tags, isLoading: false });
    } catch (err: any) {
      set({ error: err?.message || 'Failed to fetch tags.', isLoading: false });
    }
  },

  createTag: async (input: CreateTagInput) => {
    set({ isLoading: true, error: null });
    try {
      const newTag = await tagsService.createTag(input);
      set((state) => ({
        tags: [...state.tags, newTag].sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false,
      }));
      return newTag;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to create tag.', isLoading: false });
      throw err;
    }
  },

  updateTag: async (id: string, input: UpdateTagInput) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTag = await tagsService.updateTag(id, input);
      set((state) => ({
        tags: state.tags
          .map((t) => (t.id === id ? updatedTag : t))
          .sort((a, b) => a.name.localeCompare(b.name)),
        isLoading: false,
      }));
      return updatedTag;
    } catch (err: any) {
      set({ error: err?.message || 'Failed to update tag.', isLoading: false });
      throw err;
    }
  },

  deleteTag: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await tagsService.deleteTag(id);
      set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err?.message || 'Failed to delete tag.', isLoading: false });
      throw err;
    }
  },

  clearTagsState: () => {
    set({ tags: [], isLoading: false, error: null });
  },
}));
