import React from 'react';
import { PasswordGenerator } from '../components/PasswordGenerator';
import './GeneratorPage.css';

export const GeneratorPage: React.FC = () => {
  return (
    <div className="generator-page-container">
      <div className="generator-page-header">
        <h1 className="generator-page-title">Password Generator</h1>
        <p className="generator-page-subtitle">
          Generate cryptographically strong, non-predictable passwords locally in browser memory using Web Crypto API (`crypto.getRandomValues`).
        </p>
      </div>

      <div className="generator-page-content">
        <PasswordGenerator />
      </div>
    </div>
  );
};
