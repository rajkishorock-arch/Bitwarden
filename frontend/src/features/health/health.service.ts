import type { DecryptedVaultItem } from '../../types';

export interface HealthReport {
  totalItems: number;
  weakPasswords: DecryptedVaultItem[];
  reusedPasswords: DecryptedVaultItem[];
  oldPasswords: DecryptedVaultItem[];
  healthScore: number;
}

export function analyzeVaultHealth(items: DecryptedVaultItem[]): HealthReport {
  const loginItems = items.filter((item) => item.item_type === 'login');
  const totalItems = loginItems.length;

  if (totalItems === 0) {
    return {
      totalItems: 0,
      weakPasswords: [],
      reusedPasswords: [],
      oldPasswords: [],
      healthScore: 100,
    };
  }

  const weakPasswords: DecryptedVaultItem[] = [];
  const oldPasswords: DecryptedVaultItem[] = [];
  const passwordCounts: Record<string, DecryptedVaultItem[]> = {};

  const now = new Date().getTime();
  const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

  loginItems.forEach((item) => {
    const password = item.payload.password || '';

    if (password.length < 12 || !/\d/.test(password) || !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      weakPasswords.push(item);
    }

    if (password) {
      if (!passwordCounts[password]) {
        passwordCounts[password] = [];
      }
      passwordCounts[password].push(item);
    }

    const updatedAt = new Date(item.updated_at).getTime();
    if (now - updatedAt > SIX_MONTHS_MS) {
      oldPasswords.push(item);
    }
  });

  const reusedItemsSet = new Set<DecryptedVaultItem>();
  Object.values(passwordCounts).forEach((duplicates) => {
    if (duplicates.length > 1) {
      duplicates.forEach((item) => reusedItemsSet.add(item));
    }
  });
  const reusedPasswords = Array.from(reusedItemsSet);

  const weakDeduction = (weakPasswords.length / totalItems) * 40;
  const reuseDeduction = (reusedPasswords.length / totalItems) * 40;
  const oldDeduction = (oldPasswords.length / totalItems) * 20;

  const score = Math.max(0, Math.round(100 - (weakDeduction + reuseDeduction + oldDeduction)));

  return {
    totalItems,
    weakPasswords,
    reusedPasswords,
    oldPasswords,
    healthScore: score,
  };
}
