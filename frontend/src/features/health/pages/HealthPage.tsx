import React from 'react';
import { Activity, ShieldAlert, KeyRound, AlertTriangle, CreditCard, ExternalLink, CheckCircle } from 'lucide-react';
import { useVaultStore } from '../../vault/vault.store';
import { analyzeVaultHealth } from '../health.service';
import { useNavigate } from 'react-router-dom';
import './HealthPage.css';

export const HealthPage: React.FC = () => {
  const navigate = useNavigate();
  const items = useVaultStore((state) => state.items);
  const setSelectedItemId = useVaultStore((state) => state.setSelectedItemId);

  const healthSummary = analyzeVaultHealth(items);

  const handleInspectItem = (id: string) => {
    setSelectedItemId(id);
    navigate('/app/vault');
  };

  return (
    <div className="health-page-container">
      <div className="health-page-header">
        <div className="header-title-row">
          <Activity className="health-header-icon" size={24} />
          <h1>Vault Health & Security Audit</h1>
        </div>
        <p className="health-page-subtitle">
          Evaluated locally in browser memory. VaultGuard never sends passwords or vault contents to any remote server or breach database.
        </p>
      </div>

      <div className="health-summary-grid">
        <div className="summary-stat-card">
          <span className="stat-label">Total Vault Items</span>
          <span className="stat-value">{healthSummary.totalItems}</span>
        </div>

        <div className={`summary-stat-card ${healthSummary.duplicatePasswordCount > 0 ? 'warning' : 'good'}`}>
          <div className="stat-card-header">
            <AlertTriangle size={16} />
            <span className="stat-label">Reused Passwords</span>
          </div>
          <span className="stat-value">{healthSummary.duplicatePasswordCount}</span>
        </div>

        <div className={`summary-stat-card ${healthSummary.weakPasswordCount > 0 ? 'warning' : 'good'}`}>
          <div className="stat-card-header">
            <ShieldAlert size={16} />
            <span className="stat-label">Weak Passwords</span>
          </div>
          <span className="stat-value">{healthSummary.weakPasswordCount}</span>
        </div>

        <div className="summary-stat-card">
          <div className="stat-card-header">
            <KeyRound size={16} />
            <span className="stat-label">Missing Usernames</span>
          </div>
          <span className="stat-value">{healthSummary.missingUsernameCount}</span>
        </div>

        <div className="summary-stat-card">
          <div className="stat-card-header">
            <CreditCard size={16} />
            <span className="stat-label">Incomplete Cards</span>
          </div>
          <span className="stat-value">{healthSummary.incompleteCardCount}</span>
        </div>
      </div>

      <div className="health-report-section">
        <h2>Audit Results ({healthSummary.reportedItems.length} items requiring attention)</h2>

        {healthSummary.reportedItems.length === 0 ? (
          <div className="clean-vault-banner">
            <CheckCircle size={32} className="clean-icon" />
            <div>
              <h3>All Items Pass Health Audit</h3>
              <p>No weak, reused, or incomplete credentials were detected in your decrypted vault.</p>
            </div>
          </div>
        ) : (
          <div className="reported-items-list">
            {healthSummary.reportedItems.map((report) => (
              <div key={report.itemId} className="reported-item-card">
                <div className="reported-item-header">
                  <span className="reported-item-title">{report.itemTitle}</span>
                  <button
                    type="button"
                    className="inspect-btn"
                    onClick={() => handleInspectItem(report.itemId)}
                  >
                    View Item <ExternalLink size={12} style={{ marginLeft: 4 }} />
                  </button>
                </div>

                <div className="reported-issues-tags">
                  {report.issues.map((issue, idx) => (
                    <span key={idx} className="issue-badge">
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
