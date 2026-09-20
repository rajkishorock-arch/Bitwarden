import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  KeyRound,
  CreditCard,
  FileText,
  Plus,
  Search,
  ShieldCheck,
  ArrowLeft,
  Star,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useCryptoStore } from '../../../crypto/key-store';
import { useVaultStore } from '../vault.store';
import { VaultItemModal } from '../components/VaultItemModal';
import { TagChip } from '../../tags/components/TagChip';
import type { VaultItemDecrypted } from '../vault.types';
import './VaultPage.css';

export const VaultPage: React.FC = () => {
  const location = useLocation();
  const mek = useCryptoStore((state) => state.mek);
  const {
    items,
    isLoading,
    fetchItems,
    deleteItem,
    toggleFavorite,
    selectedItemId,
    setSelectedItemId,
    searchQuery,
    setSearchQuery,
  } = useVaultStore();

  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItemDecrypted | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (mek && items.length === 0 && !isLoading) {
      fetchItems(mek);
    }
  }, [mek, fetchItems, items.length, isLoading]);

  // Determine active category filter from current pathname
  const path = location.pathname;
  let categoryFilter = 'all';
  if (path.includes('/favorites')) categoryFilter = 'favorites';
  else if (path.includes('/logins')) categoryFilter = 'logins';
  else if (path.includes('/cards')) categoryFilter = 'cards';
  else if (path.includes('/notes')) categoryFilter = 'notes';

  const filteredItems = items.filter((item) => {
    // 1. Category Filter
    if (categoryFilter === 'favorites' && !item.is_favorite) return false;
    if (categoryFilter === 'logins' && item.item_type !== 'login') return false;
    if (categoryFilter === 'cards' && item.item_type !== 'card') return false;
    if (categoryFilter === 'notes' && item.item_type !== 'note') return false;

    // 2. Search Filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const payload = item.payload as any;
    const hasMatchingTag = item.tags && item.tags.some((t) => t.name.toLowerCase().includes(q));
    return (
      item.title.toLowerCase().includes(q) ||
      (payload.username && payload.username.toLowerCase().includes(q)) ||
      (payload.url && payload.url.toLowerCase().includes(q)) ||
      (payload.cardholderName && payload.cardholderName.toLowerCase().includes(q)) ||
      (payload.content && payload.content.toLowerCase().includes(q)) ||
      hasMatchingTag
    );
  });

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
    setMobileDetailOpen(true);
    setShowPassword(false);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: VaultItemDecrypted) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vault item? This action cannot be undone.')) {
      await deleteItem(id);
      setMobileDetailOpen(false);
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard size={16} />;
      case 'note':
        return <FileText size={16} />;
      default:
        return <KeyRound size={16} />;
    }
  };

  return (
    <div className="vault-page-container">
      {/* Pane 1: Vault List Column */}
      <div className={`vault-list-pane ${mobileDetailOpen ? 'mobile-hidden' : ''}`}>
        <div className="list-pane-header">
          <Input
            placeholder="Search items (Ctrl+K)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={14} />}
            className="list-search-bar"
          />
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleOpenCreateModal}>
            New Item
          </Button>
        </div>

        <div className="list-items-container">
          {filteredItems.length === 0 ? (
            <div className="empty-vault-state">
              <KeyRound size={32} className="empty-icon" />
              <p className="empty-title">
                {searchQuery ? 'No matching items' : 'No items in this category'}
              </p>
              <p className="empty-subtitle">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Click "New Item" to add your first entry.'}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={handleOpenCreateModal}
                  style={{ marginTop: 12 }}
                >
                  Create Entry
                </Button>
              )}
            </div>
          ) : (
            filteredItems.map((item) => {
              const payload = item.payload as any;
              const subtitle =
                item.item_type === 'login'
                  ? payload.username || 'Login Credential'
                  : item.item_type === 'card'
                  ? payload.cardNumber ? `•••• ${payload.cardNumber.slice(-4)}` : 'Payment Card'
                  : 'Secure Note';

              return (
                <div
                  key={item.id}
                  className={`item-row ${selectedItemId === item.id ? 'selected' : ''}`}
                  onClick={() => handleSelectItem(item.id)}
                >
                  <div className={`item-row-icon ${item.item_type}`}>
                    {getItemIcon(item.item_type)}
                  </div>
                  <div className="item-row-info">
                    <span className="item-row-title">{item.title}</span>
                    <span className="item-row-subtitle">{subtitle}</span>
                  </div>
                  <button
                    type="button"
                    className={`favorite-btn ${item.is_favorite ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    title="Toggle Favorite"
                  >
                    <Star size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Pane 2: Item Detail Inspector */}
      <div className={`vault-detail-pane ${mobileDetailOpen ? 'mobile-visible' : ''}`}>
        {selectedItem ? (
          <div className="detail-content">
            <div className="detail-mobile-bar">
              <button
                type="button"
                className="back-btn"
                onClick={() => setMobileDetailOpen(false)}
              >
                <ArrowLeft size={18} />
                <span>Back to Vault</span>
              </button>
            </div>

            <div className="detail-header">
              <div className="detail-title-group">
                <div className={`detail-type-badge ${selectedItem.item_type}`}>
                  {getItemIcon(selectedItem.item_type)}
                </div>
                <div>
                  <h2 className="detail-title">{selectedItem.title}</h2>
                  <span className="detail-type-name">{selectedItem.item_type.toUpperCase()}</span>
                </div>
              </div>
              <div className="detail-actions">
                <button
                  type="button"
                  className={`favorite-btn ${selectedItem.is_favorite ? 'active' : ''}`}
                  onClick={() => toggleFavorite(selectedItem.id)}
                  title={selectedItem.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center' }}
                >
                  <Star size={16} />
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit2 size={14} />}
                  onClick={() => handleOpenEditModal(selectedItem)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={() => handleDeleteItem(selectedItem.id)}
                >
                  Delete
                </Button>
              </div>
            </div>

            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <div className="detail-tags-row" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {selectedItem.tags.map((tag) => (
                  <TagChip key={tag.id} name={tag.name} color={tag.color} size="sm" />
                ))}
              </div>
            )}

            {/* Login Details */}
            {selectedItem.item_type === 'login' && (
              <div className="detail-section">
                {(selectedItem.payload as any).username && (
                  <div className="detail-field">
                    <label>Username / Email</label>
                    <div className="detail-value-row">
                      <span className="value-text">{(selectedItem.payload as any).username}</span>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopy((selectedItem.payload as any).username, 'username')}
                      >
                        {copiedField === 'username' ? <Check size={14} className="check-icon" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                {(selectedItem.payload as any).password && (
                  <div className="detail-field">
                    <label>Password</label>
                    <div className="detail-value-row">
                      <span className="value-text monospace">
                        {showPassword ? (selectedItem.payload as any).password : '••••••••••••••••'}
                      </span>
                      <div className="field-action-group">
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => setShowPassword((prev) => !prev)}
                          title={showPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => handleCopy((selectedItem.payload as any).password, 'password')}
                          title="Copy Password"
                        >
                          {copiedField === 'password' ? <Check size={14} className="check-icon" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {(selectedItem.payload as any).url && (
                  <div className="detail-field">
                    <label>Website URL</label>
                    <div className="detail-value-row">
                      <a
                        href={(selectedItem.payload as any).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="url-link"
                      >
                        {(selectedItem.payload as any).url}
                        <ExternalLink size={12} style={{ marginLeft: 4 }} />
                      </a>
                    </div>
                  </div>
                )}

                {(selectedItem.payload as any).notes && (
                  <div className="detail-field">
                    <label>Encrypted Notes</label>
                    <div className="notes-box">{(selectedItem.payload as any).notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Card Details */}
            {selectedItem.item_type === 'card' && (
              <div className="detail-section">
                {(selectedItem.payload as any).cardholderName && (
                  <div className="detail-field">
                    <label>Cardholder Name</label>
                    <div className="detail-value-row">
                      <span>{(selectedItem.payload as any).cardholderName}</span>
                    </div>
                  </div>
                )}

                {(selectedItem.payload as any).cardNumber && (
                  <div className="detail-field">
                    <label>Card Number</label>
                    <div className="detail-value-row">
                      <span className="monospace">{(selectedItem.payload as any).cardNumber}</span>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => handleCopy((selectedItem.payload as any).cardNumber, 'cardNumber')}
                      >
                        {copiedField === 'cardNumber' ? <Check size={14} className="check-icon" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="detail-field-row">
                  {((selectedItem.payload as any).expirationMonth || (selectedItem.payload as any).expirationYear) && (
                    <div className="detail-field half">
                      <label>Expiration</label>
                      <div className="detail-value-row">
                        <span>
                          {(selectedItem.payload as any).expirationMonth || 'MM'}/
                          {(selectedItem.payload as any).expirationYear || 'YY'}
                        </span>
                      </div>
                    </div>
                  )}

                  {(selectedItem.payload as any).cvv && (
                    <div className="detail-field half">
                      <label>CVV / Security Code</label>
                      <div className="detail-value-row">
                        <span className="monospace">{showPassword ? (selectedItem.payload as any).cvv : '•••'}</span>
                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {(selectedItem.payload as any).notes && (
                  <div className="detail-field">
                    <label>Encrypted Notes</label>
                    <div className="notes-box">{(selectedItem.payload as any).notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Note Details */}
            {selectedItem.item_type === 'note' && (
              <div className="detail-section">
                <div className="detail-field">
                  <label>Secure Content</label>
                  <div className="notes-box content-note">{(selectedItem.payload as any).content}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-detail-state">
            <ShieldCheck size={40} className="empty-detail-icon" />
            <h3>No Item Selected</h3>
            <p>Select an item from the list to view its encrypted contents.</p>
          </div>
        )}
      </div>

      {/* Creation / Edit Modal */}
      <VaultItemModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialItem={editingItem}
      />
    </div>
  );
};
