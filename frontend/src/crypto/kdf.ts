/**
 * Client-Side Key Derivation Engine (Web Crypto API)
 * Zero-Knowledge Architecture: Derives separate Account Auth Key and Master Encryption Key (MEK).
 */

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  return globalThis.crypto;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateRandomSalt(lengthBytes = 16): string {
  const bytes = new Uint8Array(lengthBytes);
  getCrypto().getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Derives Account Auth Hash (Sent to server for authentication).
 * Uses PBKDF2-HMAC-SHA256 with user's public auth_salt and domain separation.
 */
export async function deriveAccountAuthKey(
  passwordStr: string,
  authSaltHex: string,
  iterations = 600000
): Promise<string> {
  const cryptoObj = getCrypto();
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(passwordStr);
  const saltBytes = encoder.encode(authSaltHex + '_auth_domain');

  const baseKey = await cryptoObj.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await cryptoObj.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    256
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

/**
 * Derives Master Encryption Key (MEK) for AES-256-GCM.
 * Held ONLY in application memory while vault is unlocked.
 * Non-extractable (extractable = false) to prevent exporting key bytes from JS memory.
 */
export async function deriveMasterEncryptionKey(
  passwordStr: string,
  vaultSaltHex: string,
  iterations = 600000
): Promise<CryptoKey> {
  const cryptoObj = getCrypto();
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(passwordStr);
  const saltBytes = encoder.encode(vaultSaltHex + '_vault_domain');

  const baseKey = await cryptoObj.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const mek = await cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // extractable = false (Non-extractable key)
    ['encrypt', 'decrypt']
  );

  return mek;
}
