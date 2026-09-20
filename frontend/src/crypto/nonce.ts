/**
 * Cryptographic Nonce / Initialization Vector (IV) Utilities
 * Enforces 96-bit (12-byte) cryptographically secure random IV generation using crypto.getRandomValues().
 */

export function generateNonce(lengthBytes = 12): Uint8Array {
  const nonce = new Uint8Array(lengthBytes);
  window.crypto.getRandomValues(nonce);
  return nonce;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
