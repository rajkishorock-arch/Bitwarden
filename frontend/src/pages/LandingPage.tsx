import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, KeyRound, Lock, Search, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '../components/ui/Button';
import './PublicPages.css';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="landing-container">
          <div className="hero-badge">Zero-Knowledge Security Standard</div>
          <h1 className="hero-title">
            Simple, secure password management for modern teams and individuals
          </h1>
          <p className="hero-description">
            VaultGuard protects your credentials with in-browser AES-256-GCM encryption. Your master password never leaves your device.
          </p>
          <div className="hero-actions">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Create Master Vault
              </Button>
            </Link>
            <Link to="/security">
              <Button variant="outline" size="lg">
                Security Philosophy
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="landing-container">
          <h2 className="section-title">Core Application Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><Lock size={20} /></div>
              <h3>AES-256-GCM Encryption</h3>
              <p>Vault payloads are encrypted locally in your browser using unique 96-bit random nonces for every item.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><KeyRound size={20} /></div>
              <h3>Argon2id Key Derivation</h3>
              <p>Separate client-side key derivation ensures domain isolation between authentication and vault decryption.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Search size={20} /></div>
              <h3>In-Memory Search</h3>
              <p>Vault items are filtered in local memory after client-side decryption without exposing plaintexts to servers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><RefreshCw size={20} /></div>
              <h3>Password Generator</h3>
              <p>Generate high-entropy passwords using Web Crypto PRNG (crypto.getRandomValues).</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><ShieldCheck size={20} /></div>
              <h3>Vault Health Auditor</h3>
              <p>Locally inspect weak, reused, or outdated passwords to maintain strong digital security hygiene.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Smartphone size={20} /></div>
              <h3>Responsive Design</h3>
              <p>Engineered with dedicated layouts for desktop productivity, tablet drawers, and phone viewports.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
