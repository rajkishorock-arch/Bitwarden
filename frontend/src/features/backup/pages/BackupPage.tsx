import React, { useState } from 'react';
import { Download, Upload, ShieldCheck, Lock, FileText, CheckCircle } from 'lucide-react';
import { useVaultStore } from '../../vault/vault.store';
import { useCryptoStore } from '../../../crypto/key-store';
import { exportEncryptedVaultBackup, parseAndDecryptBackupFile } from '../backup.service';
import type { BackupItemPayload } from '../backup.types';
import { Button } from '../../../components/ui/Button';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import './BackupPage.css';

export const BackupPage: React.FC = () => {
  const mek = useCryptoStore((state) => state.mek);
  const { items, createItem } = useVaultStore();

  // Export State
  const [exportPassword, setExportPassword] = useState('');
  const [exportPasswordConfirm, setExportPasswordConfirm] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportSuccessMsg, setExportSuccessMsg] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Import State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPassword, setImportPassword] = useState('');
  const [importError, setImportError] = useState('');
  const [importPreviewItems, setImportPreviewItems] = useState<BackupItemPayload[] | null>(null);
  const [isDecryptingImport, setIsDecryptingImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError('');
    setExportSuccessMsg('');

    if (!exportPassword) {
      setExportError('Please enter a password to protect your backup file.');
      return;
    }
    if (exportPassword.length < 8) {
      setExportError('Export password must be at least 8 characters long.');
      return;
    }
    if (exportPassword !== exportPasswordConfirm) {
      setExportError('Export passwords do not match.');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportEncryptedVaultBackup(items, exportPassword);
      setExportSuccessMsg(`Successfully exported ${result.itemCount} items to encrypted file "${result.fileName}".`);
      setExportPassword('');
      setExportPasswordConfirm('');
    } catch (err: any) {
      setExportError(err.message || 'Failed to export backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setImportError('File size exceeds 10MB limit.');
        return;
      }
      setSelectedFile(file);
      setImportError('');
      setImportPreviewItems(null);
      setImportSuccessMsg('');
    }
  };

  const handleDecryptImportFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');

    if (!selectedFile) {
      setImportError('Please select a backup file to import.');
      return;
    }
    if (!importPassword) {
      setImportError('Please enter the password used to encrypt this backup file.');
      return;
    }

    setIsDecryptingImport(true);
    try {
      const text = await selectedFile.text();
      const result = await parseAndDecryptBackupFile(text, importPassword);
      setImportPreviewItems(result.validItems);
    } catch (err: any) {
      setImportError(err.message || 'Failed to decrypt backup file.');
    } finally {
      setIsDecryptingImport(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreviewItems || !mek) return;

    setIsImporting(true);
    setImportError('');

    try {
      let importedCount = 0;
      for (const itemPayload of importPreviewItems) {
        await createItem(
          {
            item_type: itemPayload.item_type,
            title: itemPayload.title,
            payload: itemPayload.payload,
            is_favorite: itemPayload.is_favorite || false,
          },
          mek
        );
        importedCount++;
      }

      setImportSuccessMsg(`Successfully imported ${importedCount} items into your vault.`);
      setImportPreviewItems(null);
      setSelectedFile(null);
      setImportPassword('');
    } catch (err: any) {
      setImportError(err.message || 'Failed to complete item import.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="backup-page-container">
      <div className="backup-page-header">
        <h1 className="backup-page-title">Encrypted Import & Export</h1>
        <p className="backup-page-subtitle">
          Backup your vault using standalone password-derived AES-256-GCM encryption. Backups are created and decrypted 100% locally in browser memory. Plaintext data is never sent to the server.
        </p>
      </div>

      <div className="backup-sections-grid">
        {/* Export Section */}
        <div className="backup-card">
          <div className="card-header">
            <Download size={20} className="card-header-icon" />
            <h2>Export Encrypted Backup</h2>
          </div>

          <p className="card-description">
            Exports all <strong>{items.length} vault items</strong> as an encrypted <code>.json</code> file protected by a custom backup password.
          </p>

          {exportError && <div className="backup-error-box">{exportError}</div>}
          {exportSuccessMsg && (
            <div className="backup-success-box">
              <CheckCircle size={16} />
              <span>{exportSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleExport} className="backup-form">
            <PasswordInput
              label="Backup Password"
              value={exportPassword}
              onChange={(e) => setExportPassword(e.target.value)}
              placeholder="Enter password to protect backup"
              leftIcon={<Lock size={16} />}
            />

            <PasswordInput
              label="Confirm Backup Password"
              value={exportPasswordConfirm}
              onChange={(e) => setExportPasswordConfirm(e.target.value)}
              placeholder="Confirm backup password"
              leftIcon={<Lock size={16} />}
            />

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isExporting}
              icon={<Download size={16} />}
            >
              Export Encrypted File
            </Button>
          </form>
        </div>

        {/* Import Section */}
        <div className="backup-card">
          <div className="card-header">
            <Upload size={20} className="card-header-icon" />
            <h2>Import Encrypted Backup</h2>
          </div>

          <p className="card-description">
            Select a <code>VaultGuardEncryptedBackup</code> file and enter the backup password to decrypt and restore items.
          </p>

          {importError && <div className="backup-error-box">{importError}</div>}
          {importSuccessMsg && (
            <div className="backup-success-box">
              <CheckCircle size={16} />
              <span>{importSuccessMsg}</span>
            </div>
          )}

          {!importPreviewItems ? (
            <form onSubmit={handleDecryptImportFile} className="backup-form">
              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  id="backup-file-input"
                  className="hidden-file-input"
                />
                <label htmlFor="backup-file-input" className="file-drop-area">
                  <FileText size={24} className="file-drop-icon" />
                  <span>{selectedFile ? selectedFile.name : 'Choose .json backup file'}</span>
                </label>
              </div>

              <PasswordInput
                label="Backup Decryption Password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                placeholder="Password used when exporting file"
                leftIcon={<Lock size={16} />}
              />

              <Button
                type="submit"
                variant="outline"
                size="md"
                isLoading={isDecryptingImport}
                disabled={!selectedFile || !importPassword}
                icon={<Upload size={16} />}
              >
                Decrypt & Preview Backup
              </Button>
            </form>
          ) : (
            <div className="import-preview-box">
              <div className="preview-header">
                <ShieldCheck size={20} className="preview-icon" />
                <div>
                  <h3>Backup Decrypted Successfully</h3>
                  <p>Found {importPreviewItems.length} valid items ready for import.</p>
                </div>
              </div>

              <div className="preview-actions">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isImporting}
                  onClick={handleConfirmImport}
                >
                  Import {importPreviewItems.length} Items into Vault
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setImportPreviewItems(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
