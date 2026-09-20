import { deriveMasterEncryptionKey, generateRandomSalt } from '../../crypto/kdf';
import { encryptVaultPayload } from '../../crypto/encryption';
import { decryptVaultPayload } from '../../crypto/decryption';
import type { EncryptedEnvelope } from '../../crypto/crypto.types';
import type { VaultItemDecrypted } from '../vault/vault.types';
import type { EncryptedBackupContainer, BackupItemPayload, ImportPreviewResult } from './backup.types';

/**
 * Creates an encrypted backup file (.json) protected by a user-specified export password.
 * Uses Web Crypto API PBKDF2-HMAC-SHA256 + AES-256-GCM with fresh salt and fresh 96-bit IV.
 */
export async function exportEncryptedVaultBackup(
  items: VaultItemDecrypted[],
  exportPasswordStr: string
): Promise<{ fileName: string; itemCount: number }> {
  if (!exportPasswordStr || exportPasswordStr.length < 8) {
    throw new Error('Export password must be at least 8 characters long.');
  }

  const saltHex = generateRandomSalt(16);
  const iterations = 600000;

  // Derive separate backup key using export password + fresh salt + backup domain
  const backupKey = await deriveMasterEncryptionKey(
    exportPasswordStr,
    saltHex + '_backup_domain',
    iterations
  );

  const exportPayloads: BackupItemPayload[] = items.map((item) => ({
    item_type: item.item_type,
    title: item.title,
    payload: item.payload,
    is_favorite: item.is_favorite,
  }));

  const envelope = await encryptVaultPayload(exportPayloads, backupKey);

  const container: EncryptedBackupContainer = {
    version: 1,
    format: 'VaultGuardEncryptedBackup',
    kdf: {
      algorithm: 'PBKDF2-HMAC-SHA256',
      iterations,
      salt: saltHex,
    },
    encryption: {
      algorithm: 'AES-256-GCM',
      iv: envelope.iv,
    },
    ciphertext: envelope.ciphertext,
  };

  const jsonString = JSON.stringify(container, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const fileName = `VaultGuard_Backup_${new Date().toISOString().slice(0, 10)}.json`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { fileName, itemCount: exportPayloads.length };
}

/**
 * Parses, decrypts, and validates an encrypted backup file locally in browser RAM.
 */
export async function parseAndDecryptBackupFile(
  fileContent: string,
  exportPasswordStr: string
): Promise<ImportPreviewResult> {
  let container: EncryptedBackupContainer;

  try {
    container = JSON.parse(fileContent);
  } catch (_) {
    throw new Error('Invalid file format. The backup file is not valid JSON.');
  }

  if (container.format !== 'VaultGuardEncryptedBackup') {
    throw new Error('Unsupported backup file format. Must be a VaultGuardEncryptedBackup file.');
  }

  if (container.version !== 1) {
    throw new Error(`Unsupported backup format version: ${container.version}`);
  }

  if (!container.kdf?.salt || !container.encryption?.iv || !container.ciphertext) {
    throw new Error('Malformed backup container. Missing cryptographic headers or ciphertext.');
  }

  const backupKey = await deriveMasterEncryptionKey(
    exportPasswordStr,
    container.kdf.salt + '_backup_domain',
    container.kdf.iterations || 600000
  );

  const envelope: EncryptedEnvelope = {
    version: 1,
    algorithm: 'AES-256-GCM',
    iv: container.encryption.iv,
    ciphertext: container.ciphertext,
  };

  let rawItems: BackupItemPayload[];
  try {
    rawItems = await decryptVaultPayload<BackupItemPayload[]>(envelope, backupKey);
  } catch (_) {
    throw new Error('Incorrect export password or corrupted backup file.');
  }

  if (!Array.isArray(rawItems)) {
    throw new Error('Decrypted backup payload is not a valid list of vault items.');
  }

  // Validate item schema
  const validItems = rawItems.filter(
    (item) => item && typeof item.title === 'string' && item.item_type && item.payload
  );

  return {
    totalBackupItems: rawItems.length,
    validItems,
  };
}
