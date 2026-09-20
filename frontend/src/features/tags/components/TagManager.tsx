import React, { useState } from 'react';
import { Tag as TagIcon, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { useTagsStore } from '../tags.store';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { TagChip } from './TagChip';
import './TagManager.css';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#4F46E5', // Indigo
  '#2563EB', // Blue
  '#0EA5E9', // Sky
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

export const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose }) => {
  const { tags, createTag, updateTag, deleteTag } = useTagsStore();

  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState('#4F46E5');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameClean = tagName.trim();
    if (!nameClean) {
      setError('Tag name cannot be empty.');
      return;
    }

    if (nameClean.length > 50) {
      setError('Tag name cannot exceed 50 characters.');
      return;
    }

    // Check duplicate locally
    const duplicate = tags.some(
      (t) => t.name.toLowerCase() === nameClean.toLowerCase() && t.id !== editingTagId
    );
    if (duplicate) {
      setError('A tag with this name already exists.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTagId) {
        await updateTag(editingTagId, { name: nameClean, color: tagColor });
      } else {
        await createTag({ name: nameClean, color: tagColor });
      }
      setTagName('');
      setEditingTagId(null);
      setTagColor('#4F46E5');
    } catch (err: any) {
      setError(err.message || 'Failed to save tag.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (id: string, currentName: string, currentColor: string) => {
    setEditingTagId(id);
    setTagName(currentName);
    setTagColor(currentColor);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setTagName('');
    setTagColor('#4F46E5');
    setError('');
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete tag "${name}"?`)) {
      try {
        await deleteTag(id);
      } catch (err: any) {
        setError(err.message || 'Failed to delete tag.');
      }
    }
  };

  return (
    <div className="tag-manager-backdrop">
      <div className="tag-manager-modal">
        <div className="tag-manager-modal-header">
          <div className="header-title-group">
            <TagIcon size={20} className="header-icon" />
            <h2>Manage Tags</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close Tag Manager">
            <X size={18} />
          </button>
        </div>

        <p className="tag-manager-disclaimer">
          Tag names and colors are stored as <strong>plaintext server metadata</strong> to allow organization and filtering.
        </p>

        {error && <div className="tag-manager-error-box">{error}</div>}

        <form onSubmit={handleSaveTag} className="tag-form">
          <div className="tag-form-inputs">
            <Input
              placeholder={editingTagId ? 'Rename tag...' : 'New tag name...'}
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="tag-name-input"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              icon={editingTagId ? <Check size={14} /> : <Plus size={14} />}
            >
              {editingTagId ? 'Update' : 'Add'}
            </Button>
            {editingTagId && (
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>

          <div className="color-picker-row">
            <span className="color-picker-label">Color:</span>
            <div className="color-swatches">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${tagColor === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setTagColor(c)}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>
        </form>

        <div className="tag-manager-list-section">
          <h3>Existing Tags ({tags.length})</h3>
          <div className="tag-manager-list">
            {tags.length === 0 ? (
              <p className="empty-tags-msg">No tags created yet. Add your first tag above.</p>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="tag-manager-row">
                  <TagChip name={tag.name} color={tag.color} />
                  <div className="tag-row-actions">
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => handleStartEdit(tag.id, tag.name, tag.color)}
                      title="Edit Tag"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn danger"
                      onClick={() => handleDelete(tag.id, tag.name)}
                      title="Delete Tag"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
