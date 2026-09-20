import type { VaultItemDecrypted } from '../vault/vault.types';
import type { VaultHealthSummary, HealthReportItem } from './health.types';
import { evaluatePasswordStrength } from '../generator/generator.service';

/**
 * Evaluates vault health locally in memory.
 * NEVER sends passwords or vault contents to any backend or external server.
 */
export function analyzeVaultHealth(items: VaultItemDecrypted[]): VaultHealthSummary {
  const reportedItemsMap = new Map<string, HealthReportItem>();

  // 1. Group passwords to identify duplicates
  const passwordToItemIds = new Map<string, string[]>();

  items.forEach((item) => {
    if (item.item_type === 'login') {
      const payload = item.payload as any;
      if (payload.password) {
        const existing = passwordToItemIds.get(payload.password) || [];
        existing.push(item.id);
        passwordToItemIds.set(payload.password, existing);
      }
    }
  });

  const duplicateItemIds = new Set<string>();
  passwordToItemIds.forEach((itemIds) => {
    if (itemIds.length > 1) {
      itemIds.forEach((id) => duplicateItemIds.add(id));
    }
  });

  let duplicatePasswordCount = 0;
  let weakPasswordCount = 0;
  let missingUsernameCount = 0;
  let missingWebsiteCount = 0;
  let incompleteCardCount = 0;

  items.forEach((item) => {
    const issues: string[] = [];

    if (item.item_type === 'login') {
      const payload = item.payload as any;

      if (duplicateItemIds.has(item.id)) {
        issues.push('Reused / Duplicate Password');
        duplicatePasswordCount++;
      }

      if (payload.password) {
        const strength = evaluatePasswordStrength(payload.password);
        if (payload.password.length < 12 || strength.entropyBits < 65) {
          issues.push(`Weak Password (${payload.password.length} chars, ${strength.entropyBits} bits entropy)`);
          weakPasswordCount++;
        }
      } else {
        issues.push('Missing Password');
      }

      if (!payload.username) {
        issues.push('Missing Username or Email');
        missingUsernameCount++;
      }

      if (!payload.url) {
        issues.push('Missing Website URL');
        missingWebsiteCount++;
      }
    } else if (item.item_type === 'card') {
      const payload = item.payload as any;
      if (!payload.cardNumber || !payload.expirationMonth || !payload.cvv) {
        issues.push('Incomplete Payment Card details');
        incompleteCardCount++;
      }
    }

    if (issues.length > 0) {
      reportedItemsMap.set(item.id, {
        itemId: item.id,
        itemTitle: item.title,
        itemType: item.item_type,
        issues,
      });
    }
  });

  return {
    totalItems: items.length,
    duplicatePasswordCount,
    weakPasswordCount,
    missingUsernameCount,
    missingWebsiteCount,
    incompleteCardCount,
    reportedItems: Array.from(reportedItemsMap.values()),
  };
}
