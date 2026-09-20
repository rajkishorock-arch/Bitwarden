import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check, Shield } from 'lucide-react';
import {
  generateSecurePassword,
  evaluatePasswordStrength,
  defaultGeneratorOptions,
  type GeneratorOptions,
} from '../generator.service';
import { copyToClipboardWithAutoClear } from '../../clipboard/clipboard.service';
import { Button } from '../../../components/ui/Button';
import './PasswordGenerator.css';

interface PasswordGeneratorProps {
  onSelectPassword?: (password: string) => void;
  compact?: boolean;
}

export const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({
  onSelectPassword,
  compact = false,
}) => {
  const [options, setOptions] = useState<GeneratorOptions>(defaultGeneratorOptions);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    const newPass = generateSecurePassword(options);
    setPassword(newPass);
    setCopied(false);
  };

  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length, options.uppercase, options.lowercase, options.numbers, options.symbols, options.excludeAmbiguous]);

  const handleCopy = async () => {
    if (!password) return;
    const success = await copyToClipboardWithAutoClear(password, 30);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const strength = evaluatePasswordStrength(password);

  return (
    <div className={`generator-card ${compact ? 'compact' : ''}`}>
      <div className="generator-result-box">
        <div className="result-password-display monospace">{password}</div>
        <div className="result-action-buttons">
          <button
            type="button"
            className="action-icon-btn"
            onClick={handleGenerate}
            title="Generate New Password"
            aria-label="Generate New Password"
          >
            <RefreshCw size={18} />
          </button>
          <button
            type="button"
            className={`action-icon-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy to Clipboard"
            aria-label="Copy to Clipboard"
          >
            {copied ? <Check size={18} className="check-icon" /> : <Copy size={18} />}
          </button>
        </div>
      </div>

      <div className="strength-meter-container">
        <div className="strength-header">
          <span className="strength-label-title">
            <Shield size={14} style={{ marginRight: 6 }} />
            Objective Strength: <strong>{strength.label}</strong>
          </span>
          <span className="strength-bits-badge">{strength.entropyBits} bits entropy</span>
        </div>
        <div className="strength-bar-track">
          <div
            className="strength-bar-fill"
            style={{
              width: `${Math.min(100, (strength.entropyBits / 120) * 100)}%`,
              backgroundColor: strength.color,
            }}
          />
        </div>
      </div>

      <div className="generator-options-grid">
        <div className="option-row length-row">
          <div className="label-with-value">
            <label htmlFor="length-slider">Length</label>
            <span className="length-badge">{options.length} characters</span>
          </div>
          <input
            id="length-slider"
            type="range"
            min={8}
            max={64}
            value={options.length}
            onChange={(e) => setOptions((prev) => ({ ...prev, length: Number(e.target.value) }))}
            className="generator-range-slider"
          />
        </div>

        <div className="option-checkboxes-group">
          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={(e) => setOptions((prev) => ({ ...prev, uppercase: e.target.checked }))}
            />
            <span>Uppercase (A-Z)</span>
          </label>

          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={(e) => setOptions((prev) => ({ ...prev, lowercase: e.target.checked }))}
            />
            <span>Lowercase (a-z)</span>
          </label>

          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={(e) => setOptions((prev) => ({ ...prev, numbers: e.target.checked }))}
            />
            <span>Numbers (0-9)</span>
          </label>

          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={(e) => setOptions((prev) => ({ ...prev, symbols: e.target.checked }))}
            />
            <span>Symbols (!@#$...)</span>
          </label>

          <label className="checkbox-control full-width">
            <input
              type="checkbox"
              checked={options.excludeAmbiguous}
              onChange={(e) => setOptions((prev) => ({ ...prev, excludeAmbiguous: e.target.checked }))}
            />
            <span>Exclude Ambiguous Characters (l, 1, I, O, 0)</span>
          </label>
        </div>
      </div>

      {onSelectPassword && (
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={() => onSelectPassword(password)}
          style={{ width: '100%', marginTop: 16 }}
        >
          Use This Password
        </Button>
      )}
    </div>
  );
};
