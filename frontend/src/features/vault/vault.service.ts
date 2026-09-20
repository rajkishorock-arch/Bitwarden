import { apiClient } from '../../services/api-client';
import { encryptVaultPayload, decryptVaultPayload } from '../../crypto/aes-gcm';
import { useCryptoStore } from '../../crypto/key-store';
import type {
  RawVaultItemResponse,
  DecryptedVaultItem,
  ItemType,
  DecryptedPayload,
} from '../../types';

export const vaultService = {
  async fetchItems(): Promise<DecryptedVaultItem[]> {
    const mek = useCryptoStore.getState().mek;
    if (!mek) throw new Error('Vault is locked. Decryption key unavailable.');

    const rawItems = await apiClient.get<RawVaultItemResponse[]>('/vault/items');

    const decryptedItems = await Promise.all(
      rawItems.map(async (raw) => {
        try {
          const title = await decryptVaultPayload<string>(raw.title_encrypted, raw.nonce, mek);
          const payload = await decryptVaultPayload<DecryptedPayload>(raw.payload_encrypted, raw.nonce, mek);

          return {
            id: raw.id,
            user_id: raw.user_id,
            item_type: raw.item_type,
            title,
            payload,
            nonce: raw.nonce,
            is_favorite: raw.is_favorite,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
            tags: raw.tags || [],
          } as DecryptedVaultItem;
        } catch (err) {
          console.error(`Failed to decrypt vault item ${raw.id}:`, err);
          return {
            id: raw.id,
            user_id: raw.user_id,
            item_type: raw.item_type,
            title: '[Decryption Error]',
            payload: {},
            nonce: raw.nonce,
            is_favorite: raw.is_favorite,
            created_at: raw.created_at,
            updated_at: raw.updated_at,
            tags: [],
          } as DecryptedVaultItem;
        }
      })
    );

    return decryptedItems;
  },

  async createItem(
    itemType: ItemType,
    titleStr: string,
    payloadData: DecryptedPayload,
    isFavorite = false,
    tagIds: string[] = []
  ): Promise<DecryptedVaultItem> {
    const mek = useCryptoStore.getState().mek;
    if (!mek) throw new Error('Vault is locked.');

    const encryptedTitle = await encryptVaultPayload(titleStr, mek);
    const encryptedPayload = await encryptVaultPayload(payloadData, mek);

    const rawCreated = await apiClient.post<RawVaultItemResponse>('/vault/items', {
      item_type: itemType,
      title_encrypted: encryptedTitle.ciphertextBase64,
      payload_encrypted: encryptedPayload.ciphertextBase64,
      nonce: encryptedTitle.nonceBase64,
      is_favorite: isFavorite,
      tag_ids: tagIds,
    });

    return {
      id: rawCreated.id,
      user_id: rawCreated.user_id,
      item_type: rawCreated.item_type,
      title: titleStr,
      payload: payloadData,
      nonce: rawCreated.nonce,
      is_favorite: rawCreated.is_favorite,
      created_at: rawCreated.created_at,
      updated_at: rawCreated.updated_at,
      tags: rawCreated.tags || [],
    };
  },

  async updateItem(
    id: string,
    itemType: ItemType,
    titleStr: string,
    payloadData: DecryptedPayload,
    isFavorite: boolean,
    tagIds: string[]
  ): Promise<DecryptedVaultItem> {
    const mek = useCryptoStore.getState().mek;
    if (!mek) throw new Error('Vault is locked.');

    const encryptedTitle = await encryptVaultPayload(titleStr, mek);
    const encryptedPayload = await encryptVaultPayload(payloadData, mek);

    const rawUpdated = await apiClient.put<RawVaultItemResponse>(`/vault/items/${id}`, {
      item_type: itemType,
      title_encrypted: encryptedTitle.ciphertextBase64,
      payload_encrypted: encryptedPayload.ciphertextBase64,
      nonce: encryptedTitle.nonceBase64,
      is_favorite: isFavorite,
      tag_ids: tagIds,
    });

    return {
      id: rawUpdated.id,
      user_id: rawUpdated.user_id,
      item_type: rawUpdated.item_type,
      title: titleStr,
      payload: payloadData,
      nonce: rawUpdated.nonce,
      is_favorite: rawUpdated.is_favorite,
      created_at: rawUpdated.created_at,
      updated_at: rawUpdated.updated_at,
      tags: rawUpdated.tags || [],
    };
  },

  async deleteItem(id: string): Promise<void> {
    await apiClient.delete(`/vault/items/${id}`);
  },

  async toggleFavorite(id: string): Promise<RawVaultItemResponse> {
    return apiClient.patch<RawVaultItemResponse>(`/vault/items/${id}/favorite`);
  },
};
