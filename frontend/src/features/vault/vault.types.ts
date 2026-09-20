import type { VaultItemType, VaultPayload } from '../../crypto/crypto.types';

export interface TagSimple {
  id: string;
  name: string;
  color: string;
}

export interface VaultItemEncrypted {
  id: string;
  user_id: string;
  item_type: VaultItemType;
  title_encrypted: string;
  payload_encrypted: string;
  nonce: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  tags: TagSimple[];
}

export interface VaultItemDecrypted {
  id: string;
  user_id: string;
  item_type: VaultItemType;
  title: string;
  payload: VaultPayload;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  tags: TagSimple[];
}

export interface CreateVaultItemInput {
  item_type: VaultItemType;
  title: string;
  payload: VaultPayload;
  is_favorite?: boolean;
  tag_ids?: string[];
}

export interface UpdateVaultItemInput {
  item_type?: VaultItemType;
  title?: string;
  payload?: VaultPayload;
  is_favorite?: boolean;
  tag_ids?: string[];
}
