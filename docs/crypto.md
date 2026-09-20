# VaultGuard Cryptographic Architecture Documentation

## Overview

VaultGuard employs a zero-knowledge, client-side encryption model. Sensitive vault contents (titles, usernames, passwords, card numbers, expiration dates, CVVs, and secure notes) are encrypted in the user's browser before being transmitted to the backend.

---

## Cryptographic Parameters

1. **Key Derivation (KDF)**:
   - **Algorithm**: `PBKDF2-HMAC-SHA256`
   - **Iterations**: `600,000`
   - **Derived Key Type**: 256-bit AES-GCM (`CryptoKey`)
   - **Extractable**: `false` (Web Crypto API non-extractable flag prevents key byte exportation).
   - **Domain Separation**: `vault_salt + "_vault_domain"` for Master Encryption Key (MEK); `auth_salt + "_auth_domain"` for Account Auth Hash.

2. **Authenticated Encryption**:
   - **Algorithm**: `AES-256-GCM` with 128-bit authentication tag.
   - **Initialization Vector (IV / Nonce)**: Fresh 96-bit (12-byte) cryptographically secure random IV generated per item encryption operation via `window.crypto.getRandomValues()`.

3. **In-Memory Lifetime & Security Boundaries**:
   - The MEK resides strictly in browser application memory (RAM) while unlocked.
   - The MEK is **never** serialized, exported, or written to `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
   - Master password strings are forgotten immediately after KDF completion.

---

## Server Visibility & Plaintext Metadata

The backend server and database store ciphertext envelopes (`title_encrypted`, `payload_encrypted`, `nonce`).

### Plaintext Metadata Visible to Server:
- `id`: Item UUID string
- `user_id`: Owning user UUID string
- `item_type`: Category identifier (`login` | `card` | `note`)
- `is_favorite`: Boolean flag
- `created_at` / `updated_at`: Timestamps
- `tags`: Tag name and color metadata

### Ciphertext Fields Hidden from Server:
- `title_encrypted`: Base64 AES-256-GCM ciphertext
- `payload_encrypted`: Base64 AES-256-GCM ciphertext
- `nonce`: Base64 96-bit IV

---

## Memory Clearing & Best-Effort Handling

Due to JavaScript garbage collection semantics, guaranteed physical RAM zeroization cannot be promised in browser environments. When locking the vault or logging out, VaultGuard resets internal store state (`mek = null`, `items = []`) and clears references on a best-effort basis.
