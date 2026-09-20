/**
 * Cryptographically Secure Password Generator Service
 * Uses Web Crypto API (crypto.getRandomValues) for non-predictable randomness.
 */

export interface GeneratorOptions {
  length: number; // 8 - 64
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean; // e.g., l, 1, I, O, 0
}

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const NUMBER_CHARS = '0123456789';
const SYMBOL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS_REGEX = /[l1IO0sS5zZ2]/g;

export const defaultGeneratorOptions: GeneratorOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

function getRandomInt(max: number): number {
  const randomBuffer = new Uint32Array(1);
  window.crypto.getRandomValues(randomBuffer);
  return randomBuffer[0] % max;
}

export function generateSecurePassword(options: GeneratorOptions = defaultGeneratorOptions): string {
  let charPool = '';
  const mandatoryChars: string[] = [];

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

  if (options.uppercase) {
    charPool += upper;
    mandatoryChars.push(upper[getRandomInt(upper.length)]);
  }
  if (options.lowercase) {
    charPool += lower;
    mandatoryChars.push(lower[getRandomInt(lower.length)]);
  }
  if (options.numbers) {
    charPool += nums;
    mandatoryChars.push(nums[getRandomInt(nums.length)]);
  }
  if (options.symbols) {
    charPool += syms;
    mandatoryChars.push(syms[getRandomInt(syms.length)]);
  }

  if (!charPool) {
    charPool = lower; // Fallback
    mandatoryChars.push(lower[getRandomInt(lower.length)]);
  }

  const passwordChars: string[] = [...mandatoryChars];

  while (passwordChars.length < options.length) {
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
