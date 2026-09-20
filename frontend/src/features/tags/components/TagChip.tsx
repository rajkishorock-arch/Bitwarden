import React from 'react';
import { Tag as TagIcon, X } from 'lucide-react';
import './TagChip.css';

interface TagChipProps {
  name: string;
  color?: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export const TagChip: React.FC<TagChipProps> = ({
  name,
  color = '#4F46E5',
  onRemove,
  size = 'md',
}) => {
  return (
    <span
      className={`tag-chip tag-chip-${size}`}
      style={{
        backgroundColor: `${color}1F`, // 12% opacity
        borderColor: `${color}4D`, // 30% opacity
        color: color,
      }}
    >
      <TagIcon size={size === 'sm' ? 10 : 12} className="tag-chip-icon" />
      <span className="tag-chip-name">{name}</span>
      {onRemove && (
        <button
          type="button"
          className="tag-chip-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${name} tag`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};
