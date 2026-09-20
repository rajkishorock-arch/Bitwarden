import React, { useState } from 'react';
import { KeyRound, Plus, Search, ShieldCheck, ArrowLeft, Star } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useVaultStore } from '../vault.store';
import './VaultPage.css';

export const VaultPage: React.FC = () => {
  const { items, selectedItemId, selectItem, searchQuery, setSearchQuery } = useVaultStore();
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.payload.username?.toLowerCase().includes(q) ||
      item.payload.website?.toLowerCase().includes(q)
    );
  });

  const handleSelectItem = (id: string) => {
    selectItem(id);
    setMobileDetailOpen(true);
  };

  return (
    <div className="vault-page-container">
      {/* Pane 1: Item List Column */}
      <div className={`vault-list-pane ${mobileDetailOpen ? 'mobile-hidden' : ''}`}>
        <div className="list-pane-header">
          <Input
            placeholder="Search item title or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={14} />}
            className="list-search-bar"
          />
          <Button variant="primary" size="sm" icon={<Plus size={14} />}>
            New Entry
          </Button>
        </div>

        <div className="list-items-container">
          {filteredItems.length === 0 ? (
            <div className="empty-vault-state">
              <KeyRound size={32} className="empty-icon" />
              <p className="empty-title">Your vault is empty</p>
              <p className="empty-subtitle">Add your first login, card, or secure note to get started.</p>
              <Button variant="outline" size="sm" icon={<Plus size={14} />} style={{ marginTop: 12 }}>
                Add Login Entry
              </Button>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`item-row ${selectedItemId === item.id ? 'selected' : ''}`}
                onClick={() => handleSelectItem(item.id)}
              >
                <div className="item-row-icon">
                  <KeyRound size={16} />
                </div>
                <div className="item-row-info">
                  <span className="item-row-title">{item.title}</span>
                  <span className="item-row-subtitle">{item.payload.username || item.item_type}</span>
                </div>
                {item.is_favorite && <Star size={14} className="favorite-star-active" />}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pane 2: Item Details / Inspector */}
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
                <span>Back to List</span>
              </button>
            </div>

            <div className="detail-header">
              <div className="detail-title-group">
                <div className="detail-type-badge">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="detail-title">{selectedItem.title}</h2>
                  <span className="detail-type-name">{selectedItem.item_type.toUpperCase()}</span>
                </div>
              </div>
              <div className="detail-actions">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="danger" size="sm">
                  Delete
                </Button>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-field">
                <label>Username / Email</label>
                <div className="detail-value-row">
                  <span>{selectedItem.payload.username || '—'}</span>
                </div>
              </div>

              <div className="detail-field">
                <label>Password</label>
                <div className="detail-value-row">
                  <span>••••••••••••</span>
                </div>
              </div>

              {selectedItem.payload.website && (
                <div className="detail-field">
                  <label>Website URL</label>
                  <div className="detail-value-row">
                    <a href={selectedItem.payload.website} target="_blank" rel="noopener noreferrer">
                      {selectedItem.payload.website}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="empty-detail-state">
            <ShieldCheck size={40} className="empty-detail-icon" />
            <h3>No Item Selected</h3>
            <p>Select a credential from the list to view encrypted details.</p>
          </div>
        )}
      </div>
    </div>
  );
};
