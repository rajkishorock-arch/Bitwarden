import React, { useState, useEffect } from 'react';
import { X, KeyRound, CreditCard, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useCryptoStore } from '../../../crypto/key-store';
import { useVaultStore } from '../vault.store';
import type { VaultItemType } from '../../../crypto/crypto.types';
import type { VaultItemDecrypted, CreateVaultItemInput } from '../vault.types';
import './VaultItemModal.css';

interface VaultItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: VaultItemDecrypted | null;
}

export const VaultItemModal: React.FC<VaultItemModalProps> = ({
  isOpen,
  onClose,
  initialItem,
}) => {
  const mek = useCryptoStore((state) => state.mek);
  const { createItem, updateItem } = useVaultStore();

  const [itemType, setItemType] = useState<VaultItemType>('login');
  const [title, setTitle] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [loginNotes, setLoginNotes] = useState('');

  // Card fields
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardNotes, setCardNotes] = useState('');

  // Note fields
  const [noteContent, setNoteContent] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialItem) {
      setItemType(initialItem.item_type);
      setTitle(initialItem.title);
      setIsFavorite(initialItem.is_favorite);

      if (initialItem.item_type === 'login') {
        const p = initialItem.payload as any;
        setUsername(p.username || '');
        setPassword(p.password || '');
        setUrl(p.url || '');
        setLoginNotes(p.notes || '');
      } else if (initialItem.item_type === 'card') {
        const p = initialItem.payload as any;
        setCardholderName(p.cardholderName || '');
        setCardNumber(p.cardNumber || '');
        setExpMonth(p.expirationMonth || '');
        setExpYear(p.expirationYear || '');
        setCvv(p.cvv || '');
        setCardNotes(p.notes || '');
      } else if (initialItem.item_type === 'note') {
        const p = initialItem.payload as any;
        setNoteContent(p.content || '');
      }
    } else {
      resetForm();
    }
  }, [initialItem, isOpen]);

  const resetForm = () => {
    setItemType('login');
    setTitle('');
    setIsFavorite(false);
    setUsername('');
    setPassword('');
    setUrl('');
    setLoginNotes('');
    setCardholderName('');
    setCardNumber('');
    setExpMonth('');
    setExpYear('');
    setCvv('');
    setCardNotes('');
    setNoteContent('');
    setError(null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!mek) {
      setError('Vault is locked. Unlock vault to create or edit items.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let payload: any = {};
    if (itemType === 'login') {
      payload = { username, password, url, notes: loginNotes };
    } else if (itemType === 'card') {
      payload = {
        cardholderName,
        cardNumber,
        expirationMonth: expMonth,
        expirationYear: expYear,
        cvv,
        notes: cardNotes,
      };
    } else if (itemType === 'note') {
      payload = { content: noteContent };
    }

    try {
      if (initialItem) {
        await updateItem(
          initialItem.id,
          {
            item_type: itemType,
            title,
            payload,
            is_favorite: isFavorite,
          },
          mek
        );
      } else {
        const input: CreateVaultItemInput = {
          item_type: itemType,
          title,
          payload,
          is_favorite: isFavorite,
        };
        await createItem(input, mek);
      }
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Failed to save encrypted vault item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialItem ? 'Edit Vault Entry' : 'New Vault Entry'}</h2>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="modal-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Item Type Selector */}
          {!initialItem && (
            <div className="type-selector">
              <button
                type="button"
                className={`type-btn ${itemType === 'login' ? 'active' : ''}`}
                onClick={() => setItemType('login')}
              >
                <KeyRound size={16} />
                <span>Login</span>
              </button>
              <button
                type="button"
                className={`type-btn ${itemType === 'card' ? 'active' : ''}`}
                onClick={() => setItemType('card')}
              >
                <CreditCard size={16} />
                <span>Card</span>
              </button>
              <button
                type="button"
                className={`type-btn ${itemType === 'note' ? 'active' : ''}`}
                onClick={() => setItemType('note')}
              >
                <FileText size={16} />
                <span>Secure Note</span>
              </button>
            </div>
          )}

          <div className="form-group">
            <label>Title *</label>
            <Input
              placeholder="e.g. GitHub Account, Chase Visa, Server Key"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Form Fields by Type */}
          {itemType === 'login' && (
            <>
              <div className="form-group">
                <label>Username / Email</label>
                <Input
                  placeholder="name@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <Input
                  type="password"
                  placeholder="Master password or account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Website URL</label>
                <Input
                  type="url"
                  placeholder="https://github.com/login"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  className="modal-textarea"
                  rows={3}
                  placeholder="Additional encrypted notes..."
                  value={loginNotes}
                  onChange={(e) => setLoginNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {itemType === 'card' && (
            <>
              <div className="form-group">
                <label>Cardholder Name</label>
                <Input
                  placeholder="John Doe"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Card Number</label>
                <Input
                  placeholder="4532 •••• •••• 8910"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group col-half">
                  <label>Exp Month / Year</label>
                  <div className="exp-inputs">
                    <Input
                      placeholder="MM"
                      maxLength={2}
                      value={expMonth}
                      onChange={(e) => setExpMonth(e.target.value)}
                    />
                    <span>/</span>
                    <Input
                      placeholder="YYYY"
                      maxLength={4}
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group col-half">
                  <label>Security Code (CVV)</label>
                  <Input
                    type="password"
                    maxLength={4}
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  className="modal-textarea"
                  rows={3}
                  placeholder="Encrypted card notes..."
                  value={cardNotes}
                  onChange={(e) => setCardNotes(e.target.value)}
                />
              </div>
            </>
          )}

          {itemType === 'note' && (
            <div className="form-group">
              <label>Note Content</label>
              <textarea
                className="modal-textarea"
                rows={6}
                placeholder="Enter sensitive encrypted note contents..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
              />
              <span>Mark as Favorite</span>
            </label>
          </div>

          <div className="modal-actions">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              {initialItem ? 'Save Changes' : 'Encrypt & Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
