/**
 * In-Browser AES-256-GCM Encryption / Decryption Module
 * Ensures each item payload has a unique 96-bit cryptographically random IV/nonce.
 */

export interface EncryptedPayload {
  ciphertextBase64: string;
  nonceBase64: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypts arbitrary serializable data using AES-256-GCM.
 */
export async function encryptVaultPayload<T>(
  data: T,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const jsonString = JSON.stringify(data);
  const plaintextBytes = encoder.encode(jsonString);

  // Generate unique 96-bit (12-byte) IV for GCM
  const nonce = new Uint8Array(12);
  window.crypto.getRandomValues(nonce);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce,
      tagLength: 128,
    },
    key,
    plaintextBytes
  );

  return {
    ciphertextBase64: bytesToBase64(new Uint8Array(ciphertextBuffer)),
    nonceBase64: bytesToBase64(nonce),
  };
}

/**
 * Decrypts ciphertext Base64 string using AES-256-GCM.
 */
export async function decryptVaultPayload<T>(
  ciphertextBase64: string,
  nonceBase64: string,
  key: CryptoKey
): Promise<T> {
  const ciphertextBytes = base64ToBytes(ciphertextBase64);
  const nonceBytes = base64ToBytes(nonceBase64);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonceBytes as BufferSource,
      tagLength: 128,
    },
    key,
    ciphertextBytes as BufferSource
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);
  return JSON.parse(jsonString) as T;
}
