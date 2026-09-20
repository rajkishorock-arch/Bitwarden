/**
 * Cryptographically Secure Password Generator Service
 * Uses Web Crypto API (crypto.getRandomValues) for non-predictable randomness.
 * Strictly uses rejection sampling to eliminate modulo bias.
 */

export interface GeneratorOptions {
  length: number; // 8 - 64
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean; // e.g., l, 1, I, O, 0
}

export interface PasswordStrength {
  entropyBits: number;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Very Strong';
  color: string;
}

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS_REGEX = /[l1IO0sS5zZ2]/g;

export const defaultGeneratorOptions: GeneratorOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

function getCrypto(): Crypto {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  return globalThis.crypto;
}

/**
 * Generates an unbiased random integer in [0, max) using rejection sampling.
 */
export function getRandomInt(max: number): number {
  if (max <= 0) return 0;
  const cryptoObj = getCrypto();
  const maxValid = Math.floor(0xffffffff / max) * max;
  const randomBuffer = new Uint32Array(1);
  let randomVal: number;
  do {
    cryptoObj.getRandomValues(randomBuffer);
    randomVal = randomBuffer[0];
  } while (randomVal >= maxValid);
  return randomVal % max;
}

/**
 * Generates a cryptographically secure random password based on options.
 * Guarantees at least one character from each selected character group.
 */
export function generateSecurePassword(options: GeneratorOptions = defaultGeneratorOptions): string {
  const len = Math.max(8, Math.min(64, options.length));

  let upper = UPPERCASE_CHARS;
  let lower = LOWERCASE_CHARS;
  let nums = NUMBER_CHARS;
  let syms = SYMBOL_CHARS;

  if (options.excludeAmbiguous) {
    upper = upper.replace(AMBIGUOUS_REGEX, '');
    lower = lower.replace(AMBIGUOUS_REGEX, '');
    nums = nums.replace(AMBIGUOUS_REGEX, '');
    syms = syms.replace(AMBIGUOUS_REGEX, '');
  }

  let charPool = '';
  const mandatoryChars: string[] = [];

  if (options.uppercase && upper.length > 0) {
    charPool += upper;
    mandatoryChars.push(upper[getRandomInt(upper.length)]);
  }
  if (options.lowercase && lower.length > 0) {
    charPool += lower;
    mandatoryChars.push(lower[getRandomInt(lower.length)]);
  }
  if (options.numbers && nums.length > 0) {
    charPool += nums;
    mandatoryChars.push(nums[getRandomInt(nums.length)]);
  }
  if (options.symbols && syms.length > 0) {
    charPool += syms;
    mandatoryChars.push(syms[getRandomInt(syms.length)]);
  }

  if (!charPool) {
    charPool = lower;
    mandatoryChars.push(lower[getRandomInt(lower.length)]);
  }

  const passwordChars: string[] = [...mandatoryChars];

  while (passwordChars.length < len) {
    passwordChars.push(charPool[getRandomInt(charPool.length)]);
  }

  // Fisher-Yates Shuffle using Web Crypto
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}

/**
 * Calculates objective cryptographic entropy bits and strength rating.
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { entropyBits: 0, label: 'Weak', color: '#EF4444' };
  }

  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32;

  if (poolSize === 0) poolSize = 26;

  const entropy = Math.round(password.length * Math.log2(poolSize));

  if (entropy < 50) {
    return { entropyBits: entropy, label: 'Weak', color: '#EF4444' };
  } else if (entropy < 65) {
    return { entropyBits: entropy, label: 'Fair', color: '#F59E0B' };
  } else if (entropy < 80) {
    return { entropyBits: entropy, label: 'Good', color: '#3B82F6' };
  } else if (entropy < 100) {
    return { entropyBits: entropy, label: 'Strong', color: '#10B981' };
  } else {
    return { entropyBits: entropy, label: 'Very Strong', color: '#059669' };
  }
}
