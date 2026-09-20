# VaultGuard Cryptographic Architecture Documentation

## Overview

VaultGuard employs a zero-knowledge, client-side encryption model. Sensitive vault contents (titles, usernames, passwords, card numbers, expiration dates, CVVs, and secure notes) are serialized into a single JSON object and encrypted in the user's browser using AES-256-GCM before being transmitted to the backend.

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
   - **Envelope Design**: Single versioned envelope containing consolidated `{ title, payload }`.

3. **In-Memory Lifetime & Security Boundaries**:
   - The MEK resides strictly in browser application memory (RAM) while unlocked.
   - The MEK is **never** serialized, exported, or written to `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
   - Master password strings are forgotten immediately after KDF completion.

---

## Server Visibility & Plaintext Metadata

The backend server and database store ciphertext envelopes (`encrypted_payload`, `nonce`).

### Plaintext Metadata Visible to Server:
- `id`: Item UUID string
- `user_id`: Owning user UUID string
- `item_type`: Category identifier (`login` | `card` | `note`)
- `nonce`: Base64 96-bit IV
- `is_favorite`: Boolean flag
- `created_at` / `updated_at`: Timestamps
- `tags`: Tag name and color metadata

### Ciphertext Fields Hidden from Server:
- `encrypted_payload`: Base64 AES-256-GCM ciphertext containing all titles, passwords, card numbers, notes, and usernames.

---

## Standalone Encrypted Backup Specification

Exported backups use `VaultGuardEncryptedBackup` version 1:
- Key derived using user's backup password + fresh 16-byte salt via PBKDF2 (600,000 iterations).
- Encrypted using AES-256-GCM with a fresh 96-bit IV.
- Backup encryption does **not** reuse the vault MEK directly.
- Processing occurs 100% locally in browser memory.

---

## Memory & Platform Limitations Notice

- **RAM Cleanup**: JavaScript garbage collection semantics prevent guaranteed physical RAM zeroization. When locking or logging out, VaultGuard purges store references (`mek = null`, `items = []`) on a best-effort basis.
- **Clipboard Clearing**: Clipboard auto-clear is scheduled for 30 seconds and verifies content match before clearing. OS-level clearing cannot be guaranteed across all platforms/browsers due to OS permissions.
