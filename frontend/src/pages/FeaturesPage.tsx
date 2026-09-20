import React from 'react';
import { Shield, Key, EyeOff, Clock, Smartphone, Layers } from 'lucide-react';
import './PublicPages.css';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="landing-page">
      <section className="page-hero-section">
        <div className="landing-container">
          <h1 className="hero-title">Features & Vault Architecture</h1>
          <p className="hero-description">
            Designed for clarity, information density, and absolute cryptographic privacy.
          </p>
        </div>
      </section>

      <section className="features-section">
        <div className="landing-container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><Shield size={20} /></div>
              <h3>Logins, Payment Cards & Secure Notes</h3>
              <p>Store web login credentials, payment debit/credit card details, and confidential text notes in encrypted payloads.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Key size={20} /></div>
              <h3>Password Generator</h3>
              <p>Customizable character sets (uppercase, lowercase, digits, symbols) driven by non-predictable Web Crypto randomness.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><EyeOff size={20} /></div>
              <h3>Intelligent Clipboard Protection</h3>
              <p>Copied passwords automatically clear from your clipboard after a 30-second timer, provided content is unchanged.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Clock size={20} /></div>
              <h3>Configurable Auto-Lock</h3>
              <p>Inactivity monitoring automatically purges decrypted keys and vault items from memory after 1 to 30 minutes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Layers size={20} /></div>
              <h3>Tags & Favorites</h3>
              <p>Categorize credentials with custom color-coded tags and favorite shortcuts for rapid access.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Smartphone size={20} /></div>
              <h3>Touch-Optimized Mobile UI</h3>
              <p>Dedicated single-pane navigation and fullscreen inspectors designed for one-handed mobile operation.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
