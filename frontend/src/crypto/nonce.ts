/**
 * Cryptographic Nonce / Initialization Vector (IV) Utilities
 * Enforces 96-bit (12-byte) cryptographically secure random IV generation using crypto.getRandomValues().
 */

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  return globalThis.crypto;
}

export function generateNonce(lengthBytes = 12): Uint8Array {
  const nonce = new Uint8Array(lengthBytes);
  getCrypto().getRandomValues(nonce);
  return nonce;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const btoaFn = (typeof window !== 'undefined' && window.btoa) ? window.btoa.bind(window) : globalThis.btoa;
  return btoaFn(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const atobFn = (typeof window !== 'undefined' && window.atob) ? window.atob.bind(window) : globalThis.atob;
  const binaryString = atobFn(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
