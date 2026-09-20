/**
 * AES-256-GCM Encryption Engine
 * Encrypts arbitrary serializable vault payloads into versioned EncryptedEnvelopes using Web Crypto API.
 */

import type { EncryptedEnvelope } from './crypto.types';
import { generateNonce, bytesToBase64 } from './nonce';
import { CryptoError } from './crypto.errors';

export async function encryptVaultPayload<T>(
  data: T,
  key: CryptoKey
): Promise<EncryptedEnvelope> {
  try {
    const encoder = new TextEncoder();
    const jsonString = JSON.stringify(data);
    const plaintextBytes = encoder.encode(jsonString);

    // Generate fresh 96-bit (12-byte) IV for every encryption operation
    const iv = generateNonce(12);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
        tagLength: 128,
      },
      key,
      plaintextBytes
    );

    return {
      version: 1,
      algorithm: 'AES-256-GCM',
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    };
  } catch (err: any) {
    throw new CryptoError(`Encryption failed: ${err?.message || 'Unknown Web Crypto error'}`);
  }
}

export async function encryptString(
  text: string,
  key: CryptoKey
): Promise<EncryptedEnvelope> {
  return encryptVaultPayload<string>(text, key);
}
