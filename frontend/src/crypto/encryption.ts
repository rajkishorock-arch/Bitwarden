/**
 * AES-256-GCM Encryption Engine
 * Encrypts arbitrary serializable vault payloads into versioned EncryptedEnvelopes using Web Crypto API.
 */

import type { EncryptedEnvelope } from './crypto.types';
import { generateNonce, bytesToBase64 } from './nonce';
import { CryptoError } from './crypto.errors';

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  return globalThis.crypto;
}

export async function encryptVaultPayload<T>(
  data: T,
  key: CryptoKey,
  customIv?: Uint8Array
): Promise<EncryptedEnvelope> {
  try {
    const encoder = new TextEncoder();
    const jsonString = JSON.stringify(data);
    const plaintextBytes = encoder.encode(jsonString);

    // Generate fresh 96-bit (12-byte) IV for every encryption operation if not provided
    const iv = customIv || generateNonce(12);

    const ciphertextBuffer = await getCrypto().subtle.encrypt(
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
