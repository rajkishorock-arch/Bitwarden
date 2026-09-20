/**
 * Encrypted Vault Service Client
 * Handles API communication with FastAPI backend.
 * Ensures ALL items are encrypted before sending over HTTP and decrypted in memory upon receipt.
 */

import { apiClient } from '../../services/api-client';
import {
  encryptString,
  encryptVaultPayload,
  decryptString,
  decryptVaultPayload,
  generateNonce,
} from '../../crypto';
import type { EncryptedEnvelope } from '../../crypto';
import type {
  VaultItemEncrypted,
  VaultItemDecrypted,
  CreateVaultItemInput,
  UpdateVaultItemInput,
} from './vault.types';
import type { VaultPayload } from '../../crypto/crypto.types';

export const vaultService = {
  /**
   * Fetches encrypted vault items from backend and decrypts them in memory using MEK.
   */
  async fetchVaultItems(key: CryptoKey): Promise<VaultItemDecrypted[]> {
    const encryptedItems = await apiClient.get<VaultItemEncrypted[]>('/vault/items');

    const decryptedItems = await Promise.all(
      encryptedItems.map(async (item) => {
        // Construct envelope for title
        const titleEnvelope: EncryptedEnvelope = {
          version: 1,
          algorithm: 'AES-256-GCM',
          iv: item.nonce,
          ciphertext: item.title_encrypted,
        };

        // Construct envelope for payload
        const payloadEnvelope: EncryptedEnvelope = {
          version: 1,
          algorithm: 'AES-256-GCM',
          iv: item.nonce,
          ciphertext: item.payload_encrypted,
        };

        const title = await decryptString(titleEnvelope, key);
        const payload = await decryptVaultPayload<VaultPayload>(payloadEnvelope, key);

        return {
          id: item.id,
          user_id: item.user_id,
          item_type: item.item_type,
          title,
          payload,
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
   * Encrypts plaintext title and payload client-side before posting to backend.
   */
  async createVaultItem(
    input: CreateVaultItemInput,
    key: CryptoKey
  ): Promise<VaultItemDecrypted> {
    // Generate a single fresh 96-bit IV for this item operation
    const itemIv = generateNonce(12);

    const encryptedTitle = await encryptString(input.title, key, itemIv);
    const encryptedPayload = await encryptVaultPayload(input.payload, key, itemIv);

    const payload = {
      item_type: input.item_type,
      title_encrypted: encryptedTitle.ciphertext,
      payload_encrypted: encryptedPayload.ciphertext,
      nonce: encryptedTitle.iv,
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
   * Encrypts updated plaintext title & payload client-side before sending to backend.
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
      // Generate a fresh 96-bit IV for this update operation
      const itemIv = generateNonce(12);
      const titleToEncrypt = input.title || '';
      const encryptedTitle = await encryptString(titleToEncrypt, key, itemIv);
      const encryptedPayload = await encryptVaultPayload(input.payload, key, itemIv);

      payloadToBackend.title_encrypted = encryptedTitle.ciphertext;
      payloadToBackend.payload_encrypted = encryptedPayload.ciphertext;
      payloadToBackend.nonce = encryptedTitle.iv;
    }

    const itemEncrypted = await apiClient.put<VaultItemEncrypted>(`/vault/items/${id}`, payloadToBackend);

    // Decrypt response to ensure state accuracy
    const titleEnvelope: EncryptedEnvelope = {
      version: 1,
      algorithm: 'AES-256-GCM',
      iv: itemEncrypted.nonce,
      ciphertext: itemEncrypted.title_encrypted,
    };
    const payloadEnvelope: EncryptedEnvelope = {
      version: 1,
      algorithm: 'AES-256-GCM',
      iv: itemEncrypted.nonce,
      ciphertext: itemEncrypted.payload_encrypted,
    };

    const title = await decryptString(titleEnvelope, key);
    const payload = await decryptVaultPayload<VaultPayload>(payloadEnvelope, key);

    return {
      id: itemEncrypted.id,
      user_id: itemEncrypted.user_id,
      item_type: itemEncrypted.item_type,
      title,
      payload,
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
