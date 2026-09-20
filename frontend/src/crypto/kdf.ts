/**
 * Client-Side Key Derivation Engine (Web Crypto API)
 * Zero-Knowledge Architecture: Derives separate Account Auth Key and Master Encryption Key.
 */

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateRandomSalt(lengthBytes = 16): string {
  const bytes = new Uint8Array(lengthBytes);
  window.crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/**
 * Derives Account Auth Hash (Sent to server for authentication).
 * Uses PBKDF2-HMAC-SHA256 with "vaultguard_auth_salt" modifier.
 */
export async function deriveAccountAuthKey(
  passwordStr: string,
  saltHex: string,
  iterations = 600000
): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(passwordStr);
  const saltBytes = encoder.encode(saltHex + "_auth");

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
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
 * Held ONLY in browser memory while vault is unlocked.
 */
export async function deriveMasterEncryptionKey(
  passwordStr: string,
  saltHex: string,
  iterations = 600000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(passwordStr);
  const saltBytes = encoder.encode(saltHex + "_enc");

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const mek = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // extractable = false (Prevents dumping key from JS memory)
    ['encrypt', 'decrypt']
  );

  return mek;
}
