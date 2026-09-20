import React, { useEffect } from 'react';
import { useTagsStore } from '../tags.store';
import { TagChip } from './TagChip';
import './TagPicker.css';

interface TagPickerProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  onOpenManager?: () => void;
}

export const TagPicker: React.FC<TagPickerProps> = ({
  selectedTagIds,
  onChange,
  onOpenManager,
}) => {
  const { tags, fetchTags } = useTagsStore();

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((tId) => tId !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  return (
    <div className="tag-picker-container">
      <div className="tag-picker-header">
        <label className="tag-picker-label">Tags (Plaintext Metadata)</label>
        {onOpenManager && (
          <button type="button" className="tag-manager-link-btn" onClick={onOpenManager}>
            Manage Tags
          </button>
        )}
      </div>

      <div className="tag-picker-list">
        {tags.length === 0 ? (
          <span className="no-tags-hint">No tags created yet.</span>
        ) : (
          tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                className={`tag-picker-item ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleTag(tag.id)}
              >
                <TagChip name={tag.name} color={tag.color} size="sm" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
