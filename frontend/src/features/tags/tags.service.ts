import { apiClient } from '../../services/api-client';
import type { Tag, CreateTagInput, UpdateTagInput } from './tags.types';

export const tagsService = {
  async fetchTags(): Promise<Tag[]> {
    return apiClient.get<Tag[]>('/tags');
  },

  async createTag(input: CreateTagInput): Promise<Tag> {
    return apiClient.post<Tag>('/tags', input);
  },

  async updateTag(id: string, input: UpdateTagInput): Promise<Tag> {
    return apiClient.put<Tag>(`/tags/${id}`, input);
  },

  async deleteTag(id: string): Promise<void> {
    await apiClient.delete(`/tags/${id}`);
  },
};
