export type ItemType = 'login' | 'card' | 'note';

export interface User {
  id: string;
  email: string;
  auth_salt: string;
  vault_salt: string;
  kdf_iterations: number;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  auto_lock_minutes: number;
  clipboard_timeout_seconds: number;
  theme: 'light' | 'dark' | 'system';
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface RawVaultItemResponse {
  id: string;
  user_id: string;
  item_type: ItemType;
  title_encrypted: string;
  payload_encrypted: string;
  nonce: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface LoginPayload {
  username?: string;
  password?: string;
  website?: string;
  notes?: string;
}

export interface CardPayload {
  cardholder?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  pin?: string;
  notes?: string;
}

export interface NotePayload {
  content?: string;
}

export type DecryptedPayload = LoginPayload & CardPayload & NotePayload;

export interface DecryptedVaultItem {
  id: string;
  user_id: string;
  item_type: ItemType;
  title: string;
  payload: DecryptedPayload;
  nonce: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}
