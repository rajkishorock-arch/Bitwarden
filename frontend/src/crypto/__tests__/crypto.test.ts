/**
 * Comprehensive Web Crypto Cryptographic Test Suite
 * Validates AES-256-GCM single envelope encryption, IV uniqueness, tampering detection, and key mismatch handling.
 */

import { deriveMasterEncryptionKey } from '../kdf';
import { encryptVaultPayload } from '../encryption';
import { decryptVaultPayload } from '../decryption';
import { DecryptionError, UnsupportedVersionError } from '../crypto.errors';
import type { EncryptedEnvelope, VaultItemContent } from '../crypto.types';

declare const process: any;

async function runCryptoTests() {
  console.log('=== RUNNING CRYPTOGRAPHIC SECURITY TESTS ===\n');
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

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0 && typeof process !== 'undefined') {
    process.exit(1);
  }
}

runCryptoTests().catch((err) => {
  console.error('Fatal error running crypto tests:', err);
  if (typeof process !== 'undefined') {
    process.exit(1);
  }
});
