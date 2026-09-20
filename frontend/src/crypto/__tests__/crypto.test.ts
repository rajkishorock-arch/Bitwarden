/**
 * Comprehensive Web Crypto & Phase 4 Security Test Suite
 * Validates AES-256-GCM single envelope encryption, IV uniqueness, password generator,
 * local health analysis, and encrypted backup export/import validation.
 */

import { deriveMasterEncryptionKey } from '../kdf';
import { encryptVaultPayload } from '../encryption';
import { decryptVaultPayload } from '../decryption';
import { DecryptionError, UnsupportedVersionError } from '../crypto.errors';
import type { EncryptedEnvelope, VaultItemContent } from '../crypto.types';

import { generateSecurePassword, evaluatePasswordStrength } from '../../features/generator/generator.service';
import { analyzeVaultHealth } from '../../features/health/health.service';
import { parseAndDecryptBackupFile } from '../../features/backup/backup.service';
import type { VaultItemDecrypted } from '../../features/vault/vault.types';
import type { EncryptedBackupContainer } from '../../features/backup/backup.types';

declare const process: any;

async function runSecurityTestSuite() {
  console.log('=== RUNNING PHASE 4 SECURITY & CRYPTOGRAPHY TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Setup MEKs and sample vault item
  const saltHex = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const mek = await deriveMasterEncryptionKey('MasterPassword123!', saltHex, 600000);
  const wrongMek = await deriveMasterEncryptionKey('WrongPassword999!', saltHex, 600000);

  const sampleItem: VaultItemContent = {
    title: 'My Bank Account',
    payload: {
      username: 'user_john_doe',
      password: 'SuperSecretBankPassword#2026',
      url: 'https://bank.example.com',
      notes: 'Contains secondary security PIN 9876',
    },
  };

  // Test 1: Two separate encryption operations with same MEK produce DIFFERENT IVs
  try {
    const envelope1 = await encryptVaultPayload(sampleItem, mek);
    const envelope2 = await encryptVaultPayload(sampleItem, mek);

    assert(
      envelope1.iv !== envelope2.iv,
      'Two separate encryption operations with the same MEK produce distinct 96-bit IVs'
    );
    assert(
      envelope1.ciphertext !== envelope2.ciphertext,
      'Two separate encryption operations produce distinct ciphertexts due to fresh IVs'
    );
  } catch (err: any) {
    assert(false, `IV uniqueness test threw error: ${err.message}`);
  }

  // Test 2: decrypt(encrypt(item)) == item (Roundtrip fidelity)
  try {
    const envelope = await encryptVaultPayload(sampleItem, mek);
    const decrypted = await decryptVaultPayload<VaultItemContent>(envelope, mek);

    assert(
      JSON.stringify(decrypted) === JSON.stringify(sampleItem),
      'decrypt(encrypt(item)) accurately restores original item payload'
    );
  } catch (err: any) {
    assert(false, `Roundtrip test threw error: ${err.message}`);
  }

  // Test 3: Tampered ciphertext fails (GCM Authentication failure)
  try {
    const envelope = await encryptVaultPayload(sampleItem, mek);
    const originalChar = envelope.ciphertext.slice(-1);
    const replacementChar = originalChar === 'A' ? 'B' : 'A';
    const tamperedCiphertext = envelope.ciphertext.slice(0, -1) + replacementChar;

    const tamperedEnvelope: EncryptedEnvelope = {
      ...envelope,
      ciphertext: tamperedCiphertext,
    };

    let caught = false;
    try {
      await decryptVaultPayload(tamperedEnvelope, mek);
    } catch (err) {
      if (err instanceof DecryptionError) {
        caught = true;
      }
    }
    assert(caught, 'Tampered ciphertext fails GCM tag check and throws DecryptionError');
  } catch (err: any) {
    assert(false, `Tampered ciphertext test error: ${err.message}`);
  }

  // Test 4: Tampered IV fails
  try {
    const envelope = await encryptVaultPayload(sampleItem, mek);
    const tamperedIv = envelope.iv.slice(0, -2) + 'AA';
    const tamperedEnvelope: EncryptedEnvelope = {
      ...envelope,
      iv: tamperedIv,
    };

    let caught = false;
    try {
      await decryptVaultPayload(tamperedEnvelope, mek);
    } catch (err) {
      if (err instanceof DecryptionError) {
        caught = true;
      }
    }
    assert(caught, 'Tampered IV fails decryption and throws DecryptionError');
  } catch (err: any) {
    assert(false, `Tampered IV test error: ${err.message}`);
  }

  // Test 5: Wrong MEK fails
  try {
    const envelope = await encryptVaultPayload(sampleItem, mek);

    let caught = false;
    try {
      await decryptVaultPayload(envelope, wrongMek);
    } catch (err) {
      if (err instanceof DecryptionError) {
        caught = true;
      }
    }
    assert(caught, 'Attempting decryption with incorrect MEK fails and throws DecryptionError');
  } catch (err: any) {
    assert(false, `Wrong MEK test error: ${err.message}`);
  }

  // Test 6: Malformed envelope fails
  try {
    const malformedEnvelope = {
      version: 1,
      algorithm: 'AES-256-GCM',
      iv: 'InvalidBase64!!!',
      ciphertext: 'InvalidBase64!!!',
    } as EncryptedEnvelope;

    let caught = false;
    try {
      await decryptVaultPayload(malformedEnvelope, mek);
    } catch (err) {
      if (err instanceof DecryptionError) {
        caught = true;
      }
    }
    assert(caught, 'Malformed base64 envelope fails and throws DecryptionError');
  } catch (err: any) {
    assert(false, `Malformed envelope test error: ${err.message}`);
  }

  // Test 7: Unsupported version fails
  try {
    const envelope = await encryptVaultPayload(sampleItem, mek);
    const unsupportedEnvelope: EncryptedEnvelope = {
      ...envelope,
      version: 99,
    };

    let caught = false;
    try {
      await decryptVaultPayload(unsupportedEnvelope, mek);
    } catch (err) {
      if (err instanceof UnsupportedVersionError) {
        caught = true;
      }
    }
    assert(caught, 'Unsupported envelope version throws UnsupportedVersionError');
  } catch (err: any) {
    assert(false, `Unsupported version test error: ${err.message}`);
  }

  // Test 8: Password Generator Web Crypto Randomness & Character Groups
  try {
    const pass20 = generateSecurePassword({
      length: 20,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
    });
    assert(pass20.length === 20, 'Password generator produces exact requested length (20)');
    assert(/[A-Z]/.test(pass20), 'Generated password contains uppercase character');
    assert(/[a-z]/.test(pass20), 'Generated password contains lowercase character');
    assert(/[0-9]/.test(pass20), 'Generated password contains number character');
    assert(/[^a-zA-Z0-9]/.test(pass20), 'Generated password contains symbol character');

    const strength = evaluatePasswordStrength(pass20);
    assert(strength.entropyBits > 80, '20-character diverse password achieves > 80 bits entropy');
  } catch (err: any) {
    assert(false, `Password generator test error: ${err.message}`);
  }

  // Test 9: Local Vault Health Audit
  try {
    const mockItems: VaultItemDecrypted[] = [
      {
        id: '1',
        user_id: 'u1',
        item_type: 'login',
        title: 'Service A',
        payload: { username: 'alice', password: 'SharedPassword123!', url: 'https://a.com' },
        is_favorite: false,
        created_at: '',
        updated_at: '',
        tags: [],
      },
      {
        id: '2',
        user_id: 'u1',
        item_type: 'login',
        title: 'Service B',
        payload: { username: 'alice', password: 'SharedPassword123!', url: 'https://b.com' },
        is_favorite: false,
        created_at: '',
        updated_at: '',
        tags: [],
      },
      {
        id: '3',
        user_id: 'u1',
        item_type: 'login',
        title: 'Service C',
        payload: { username: '', password: '123', url: '' },
        is_favorite: false,
        created_at: '',
        updated_at: '',
        tags: [],
      },
    ];

    const health = analyzeVaultHealth(mockItems);
    assert(health.duplicatePasswordCount === 2, 'Vault health correctly identifies 2 reused password instances');
    assert(health.weakPasswordCount === 1, 'Vault health correctly identifies weak password ("123")');
    assert(health.missingUsernameCount === 1, 'Vault health correctly flags missing username');
    assert(health.missingWebsiteCount === 1, 'Vault health correctly flags missing website URL');
  } catch (err: any) {
    assert(false, `Vault health test error: ${err.message}`);
  }

  // Test 10: Encrypted Backup & Import Validation
  try {
    const exportPass = 'ExportPassphrase999!';
    const backupKey = await deriveMasterEncryptionKey(exportPass, 'salt123_backup_domain', 600000);

    const testPayloads = [
      { item_type: 'login' as const, title: 'Export Item 1', payload: { password: 'Pass1' } },
    ];
    const envelope = await encryptVaultPayload(testPayloads, backupKey);

    const container: EncryptedBackupContainer = {
      version: 1,
      format: 'VaultGuardEncryptedBackup',
      kdf: { algorithm: 'PBKDF2-HMAC-SHA256', iterations: 600000, salt: 'salt123' },
      encryption: { algorithm: 'AES-256-GCM', iv: envelope.iv },
      ciphertext: envelope.ciphertext,
    };

    const containerJson = JSON.stringify(container);

    // Decrypt with correct password (roundtrip)
    const result = await parseAndDecryptBackupFile(containerJson, exportPass);
    assert(result.validItems.length === 1, 'Encrypted backup correctly decrypts and restores valid items');

    // Attempt decrypt with wrong password
    let caughtWrongPass = false;
    try {
      await parseAndDecryptBackupFile(containerJson, 'WrongExportPass123!');
    } catch (err: any) {
      if (err.message.includes('Incorrect export password')) {
        caughtWrongPass = true;
      }
    }
    assert(caughtWrongPass, 'Decrypting backup with wrong password fails with clear security error');

    // Tampered ciphertext in backup container
    const tamperedContainerCiphertext = {
      ...container,
      ciphertext: container.ciphertext.slice(0, -2) + 'AA',
    };
    let caughtTamperedCiphertext = false;
    try {
      await parseAndDecryptBackupFile(JSON.stringify(tamperedContainerCiphertext), exportPass);
    } catch (err: any) {
      if (err.message.includes('Incorrect export password or corrupted backup file')) {
        caughtTamperedCiphertext = true;
      }
    }
    assert(caughtTamperedCiphertext, 'Tampered ciphertext in backup fails decryption check');

    // Tampered IV in backup container
    const tamperedContainerIv = {
      ...container,
      encryption: { algorithm: 'AES-256-GCM', iv: container.encryption.iv.slice(0, -2) + 'BB' },
    };
    let caughtTamperedIv = false;
    try {
      await parseAndDecryptBackupFile(JSON.stringify(tamperedContainerIv), exportPass);
    } catch (err: any) {
      if (err.message.includes('Incorrect export password or corrupted backup file')) {
        caughtTamperedIv = true;
      }
    }
    assert(caughtTamperedIv, 'Tampered IV in backup fails decryption check');

    // Tampered salt in backup container
    const tamperedContainerSalt = {
      ...container,
      kdf: { ...container.kdf, salt: 'tampered_salt_999' },
    };
    let caughtTamperedSalt = false;
    try {
      await parseAndDecryptBackupFile(JSON.stringify(tamperedContainerSalt), exportPass);
    } catch (err: any) {
      if (err.message.includes('Incorrect export password or corrupted backup file')) {
        caughtTamperedSalt = true;
      }
    }
    assert(caughtTamperedSalt, 'Tampered KDF salt in backup fails decryption check');

    // Malformed backup (invalid JSON)
    let caughtMalformedJson = false;
    try {
      await parseAndDecryptBackupFile('{ invalid_json_syntax: true ', exportPass);
    } catch (err: any) {
      if (err.message.includes('Invalid file format')) {
        caughtMalformedJson = true;
      }
    }
    assert(caughtMalformedJson, 'Malformed non-JSON backup string fails with format error');

    // Unsupported backup version
    const unsupportedVersionContainer = { ...container, version: 99 };
    let caughtUnsupportedVersion = false;
    try {
      await parseAndDecryptBackupFile(JSON.stringify(unsupportedVersionContainer), exportPass);
    } catch (err: any) {
      if (err.message.includes('Unsupported backup format version')) {
        caughtUnsupportedVersion = true;
      }
    }
    assert(caughtUnsupportedVersion, 'Unsupported backup version fails with version error');

    // Plaintext sentinel check in encrypted backup file content
    const sentinelPassword = 'SENTINEL_BACKUP_SECRET_PASS_2026';
    const sentinelPayloads = [
      { item_type: 'login' as const, title: 'Sentinel Item', payload: { password: sentinelPassword } },
    ];
    const sentinelEnvelope = await encryptVaultPayload(sentinelPayloads, backupKey);
    const sentinelContainer: EncryptedBackupContainer = {
      version: 1,
      format: 'VaultGuardEncryptedBackup',
      kdf: { algorithm: 'PBKDF2-HMAC-SHA256', iterations: 600000, salt: 'salt123' },
      encryption: { algorithm: 'AES-256-GCM', iv: sentinelEnvelope.iv },
      ciphertext: sentinelEnvelope.ciphertext,
    };
    const sentinelJsonString = JSON.stringify(sentinelContainer);
    assert(
      !sentinelJsonString.includes(sentinelPassword),
      'Plaintext sentinel password does not appear in exported encrypted backup file JSON string'
    );
  } catch (err: any) {
    assert(false, `Encrypted backup test error: ${err.message}`);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0 && typeof process !== 'undefined') {
    process.exit(1);
  }
}

runSecurityTestSuite().catch((err) => {
  console.error('Fatal error running security tests:', err);
  if (typeof process !== 'undefined') {
    process.exit(1);
  }
});
