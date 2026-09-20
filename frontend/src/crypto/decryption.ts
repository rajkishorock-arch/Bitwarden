/**
 * AES-256-GCM Decryption Engine
 * Decrypts versioned EncryptedEnvelopes into original typed data payloads using Web Crypto API.
 */

import type { EncryptedEnvelope } from './crypto.types';
import { base64ToBytes } from './nonce';
import { DecryptionError, UnsupportedVersionError } from './crypto.errors';

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  return globalThis.crypto;
}

export async function decryptVaultPayload<T>(
  envelope: EncryptedEnvelope,
  key: CryptoKey
): Promise<T> {
  if (envelope.version !== 1) {
    throw new UnsupportedVersionError(envelope.version);
  }

  try {
    const ivBytes = base64ToBytes(envelope.iv);
    const ciphertextBytes = base64ToBytes(envelope.ciphertext);

    const decryptedBuffer = await getCrypto().subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes as BufferSource,
        tagLength: 128,
      },
      key,
      ciphertextBytes as BufferSource
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch (err: any) {
    if (err instanceof UnsupportedVersionError) {
      throw err;
    }
    throw new DecryptionError('Unable to decrypt payload. Master encryption key mismatch or corrupted ciphertext.');
  }
}
