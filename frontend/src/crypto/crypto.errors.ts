/**
 * Custom Cryptography Error Hierarchy
 */

export class CryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

export class InvalidPasswordError extends CryptoError {
  constructor(message = 'Unable to unlock vault. Check your master password.') {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

export class DecryptionError extends CryptoError {
  constructor(message = 'Failed to decrypt vault item. Data may be corrupted or key mismatch.') {
    super(message);
    this.name = 'DecryptionError';
  }
}

export class UnsupportedVersionError extends CryptoError {
  constructor(version: number) {
    super(`Unsupported payload encryption version: ${version}`);
    this.name = 'UnsupportedVersionError';
  }
}

export class PayloadError extends CryptoError {
  constructor(message = 'Invalid vault payload structure.') {
    super(message);
    this.name = 'PayloadError';
  }
}
