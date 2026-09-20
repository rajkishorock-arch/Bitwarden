/**
 * Encrypted Vault Service Client
 * Handles API communication with FastAPI backend.
 * Ensures ALL items are encrypted before sending over HTTP and decrypted in memory upon receipt.
 * Enforces a SINGLE AES-256-GCM envelope and fresh 96-bit IV per item operation.
 */

import { apiClient } from '../../services/api-client';
import {
  encryptVaultPayload,
  decryptVaultPayload,
} from '../../crypto';
import type { EncryptedEnvelope, VaultItemContent } from '../../crypto';
import type {
  VaultItemEncrypted,
  VaultItemDecrypted,
  CreateVaultItemInput,
  UpdateVaultItemInput,
} from './vault.types';

export const vaultService = {
  /**
   * Fetches encrypted vault items from backend and decrypts them in memory using MEK.
   */
  async fetchVaultItems(key: CryptoKey): Promise<VaultItemDecrypted[]> {
    const encryptedItems = await apiClient.get<VaultItemEncrypted[]>('/vault/items');

    const decryptedItems = await Promise.all(
      encryptedItems.map(async (item) => {
        const envelope: EncryptedEnvelope = {
          version: 1,
          algorithm: 'AES-256-GCM',
          iv: item.nonce,
          ciphertext: item.encrypted_payload,
        };

        const itemContent = await decryptVaultPayload<VaultItemContent>(envelope, key);

        return {
          id: item.id,
          user_id: item.user_id,
          item_type: item.item_type,
          title: itemContent.title,
          payload: itemContent.payload,
          is_favorite: item.is_favorite,
          created_at: item.created_at,
          updated_at: item.updated_at,
          tags: item.tags || [],
        };
      })
    );

    return decryptedItems;
  },

  /**
   * Encrypts plaintext title + payload as a single object client-side before posting to backend.
   */
  async createVaultItem(
    input: CreateVaultItemInput,
    key: CryptoKey
  ): Promise<VaultItemDecrypted> {
    const itemContent: VaultItemContent = {
      title: input.title,
      payload: input.payload,
    };

    // Encrypt title and payload into a single envelope with a fresh 96-bit IV
    const envelope = await encryptVaultPayload(itemContent, key);

    const payload = {
      item_type: input.item_type,
      encrypted_payload: envelope.ciphertext,
      nonce: envelope.iv,
      is_favorite: input.is_favorite || false,
      tag_ids: input.tag_ids || [],
    };

    const itemEncrypted = await apiClient.post<VaultItemEncrypted>('/vault/items', payload);

    return {
      id: itemEncrypted.id,
      user_id: itemEncrypted.user_id,
      item_type: itemEncrypted.item_type,
      title: input.title,
      payload: input.payload,
      is_favorite: itemEncrypted.is_favorite,
      created_at: itemEncrypted.created_at,
      updated_at: itemEncrypted.updated_at,
      tags: itemEncrypted.tags || [],
    };
  },

  /**
   * Encrypts updated plaintext title & payload client-side into a single envelope before sending to backend.
   */
  async updateVaultItem(
    id: string,
    input: UpdateVaultItemInput,
    key: CryptoKey
  ): Promise<VaultItemDecrypted> {
    const payloadToBackend: Record<string, any> = {};

    if (input.item_type !== undefined) {
      payloadToBackend.item_type = input.item_type;
    }
    if (input.is_favorite !== undefined) {
      payloadToBackend.is_favorite = input.is_favorite;
    }
    if (input.tag_ids !== undefined) {
      payloadToBackend.tag_ids = input.tag_ids;
    }

    if (input.title !== undefined || input.payload !== undefined) {
      const itemContent: VaultItemContent = {
        title: input.title || '',
        payload: input.payload!,
      };

      const envelope = await encryptVaultPayload(itemContent, key);

      payloadToBackend.encrypted_payload = envelope.ciphertext;
      payloadToBackend.nonce = envelope.iv;
    }

    const itemEncrypted = await apiClient.put<VaultItemEncrypted>(`/vault/items/${id}`, payloadToBackend);

    const envelope: EncryptedEnvelope = {
      version: 1,
      algorithm: 'AES-256-GCM',
      iv: itemEncrypted.nonce,
      ciphertext: itemEncrypted.encrypted_payload,
    };

    const itemContent = await decryptVaultPayload<VaultItemContent>(envelope, key);

    return {
      id: itemEncrypted.id,
      user_id: itemEncrypted.user_id,
      item_type: itemEncrypted.item_type,
      title: itemContent.title,
      payload: itemContent.payload,
      is_favorite: itemEncrypted.is_favorite,
      created_at: itemEncrypted.created_at,
      updated_at: itemEncrypted.updated_at,
      tags: itemEncrypted.tags || [],
    };
  },

  async deleteVaultItem(id: string): Promise<void> {
    await apiClient.delete(`/vault/items/${id}`);
  },

  async toggleFavorite(id: string): Promise<VaultItemEncrypted> {
    return apiClient.patch<VaultItemEncrypted>(`/vault/items/${id}/favorite`);
  },
};
