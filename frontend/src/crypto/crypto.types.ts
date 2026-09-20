/**
 * Cryptography Type Definitions for VaultGuard
 */

export interface EncryptedEnvelope {
  version: number; // 1
  algorithm: 'AES-256-GCM';
  iv: string; // Base64 encoded 96-bit IV/nonce
  ciphertext: string; // Base64 encoded ciphertext with GCM auth tag
}

export type CryptoLockState = 'LOCKED' | 'UNLOCKING' | 'UNLOCKED' | 'LOCKING';

export type VaultItemType = 'login' | 'card' | 'note';

export interface LoginPayload {
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
}

export interface CardPayload {
  cardholderName?: string;
  cardNumber?: string;
  expirationMonth?: string;
  expirationYear?: string;
  cvv?: string;
  notes?: string;
}

export interface NotePayload {
  content: string;
}

export type VaultPayload = LoginPayload | CardPayload | NotePayload;
