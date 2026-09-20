export interface HealthReportItem {
  itemId: string;
  itemTitle: string;
  itemType: string;
  issues: string[];
}

export interface VaultHealthSummary {
  totalItems: number;
  duplicatePasswordCount: number;
  weakPasswordCount: number;
  missingUsernameCount: number;
  missingWebsiteCount: number;
  incompleteCardCount: number;
  reportedItems: HealthReportItem[];
}
