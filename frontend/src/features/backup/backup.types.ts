import type { VaultItemType, VaultPayload } from '../../crypto/crypto.types';

export interface EncryptedBackupContainer {
  version: number; // 1
  format: 'VaultGuardEncryptedBackup';
  kdf: {
    algorithm: 'PBKDF2-HMAC-SHA256';
    iterations: number; // 600000
    salt: string; // Hex salt
  };
  encryption: {
    algorithm: 'AES-256-GCM';
    iv: string; // Base64 96-bit IV
  };
  ciphertext: string; // Base64 ciphertext of serialized items array
}

export interface BackupItemPayload {
  item_type: VaultItemType;
  title: string;
  payload: VaultPayload;
  is_favorite?: boolean;
}

export interface ExportBackupResult {
  fileName: string;
  itemCount: number;
}

export interface ImportPreviewResult {
  totalBackupItems: number;
  validItems: BackupItemPayload[];
}
