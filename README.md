# VaultGuard - Zero-Knowledge Password Manager

VaultGuard is a commercial-grade, secure, modern full-stack password-management web application built with a zero-knowledge cryptographic architecture.

## Key Features & Security Architecture
- **Zero-Knowledge Encryption**: PBKDF2-HMAC-SHA256 (600,000 iterations) key derivation, AES-256-GCM authenticated envelope encryption with fresh 96-bit random IV per item.
- **Cryptographically Secure Password Generator**: Unbiased rejection sampling via Web Crypto API (`crypto.getRandomValues`). Supports lengths 8-64 with objective entropy scoring.
- **Local Vault Health Audit**: Local memory analysis for duplicate passwords, weak credentials, and missing fields. Zero remote breach database transmission.
- **Clipboard Auto-Clear**: 30-second clear timer verifying clipboard content match before clearing.
- **Auto-Lock Timeout**: Inactivity monitoring (1m, 5m, 10m, 30m, Never) automatically purging memory references on expiry.
- **Encrypted Import / Export**: Standalone password-protected AES-256-GCM encrypted backup files (`VaultGuardEncryptedBackup`).
- **Tags & Favorites Management**: Category filtering and metadata tag organization.

## Tech Stack
- **Frontend**: React 19, Vite, TypeScript, Lucide Icons, Zustand, React Router 7
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.0 Async ORM, Alembic Migrations
- **Database**: SQLite for development, PostgreSQL-ready schema for production

## Project Structure
```text
Bitwarden/
├── backend/            # FastAPI API engine & SQLAlchemy models
│   ├── alembic/       # Database migration scripts
│   ├── app/
│   │   ├── api/v1/    # Versioned API routes (auth, vault, tags, settings)
│   │   ├── core/      # Security, CSRF protection, configuration
│   │   ├── database/  # Async database session & engine
│   │   ├── models/    # SQLAlchemy 2.0 ORM models
│   │   └── schemas/   # Pydantic v2 validation schemas
│   └── tests/         # Pytest automated test suite
├── docs/              # System & Cryptographic Architecture docs
├── frontend/           # React + Vite + TypeScript web application
│   └── src/
│       ├── crypto/    # Web Crypto API KDF, AES-GCM, IV utilities
│       ├── features/  # Feature modules (vault, generator, health, tags, backup, autolock)
│       └── services/  # API client & clipboard protection
└── README.md
```

## Getting Started

### Backend Setup
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run database migrations
cd backend
python -m alembic upgrade head

# Run development server
$env:PYTHONPATH="backend"; uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Running Test Suites
```bash
# Backend pytest suite
$env:PYTHONPATH="backend"; python -m pytest backend/tests

# Frontend Web Crypto security test suite
cd frontend
npx tsx src/crypto/__tests__/crypto.test.ts
```
