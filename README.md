# VaultGuard - Professional Password Vault Web Application

VaultGuard is a commercial-grade, secure, modern full-stack password-management web application built with a zero-knowledge cryptographic architecture.

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript, Lucide Icons, Zustand, React Router
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.0 Async ORM, Argon2id, PyJWT
- **Database**: SQLite for development, PostgreSQL-ready architecture for production
- **Security**: Zero-Knowledge Client-Side Key Derivation (Argon2id) & In-Browser AES-256-GCM Encryption

## Project Structure
```text
Bitwarden/
├── backend/            # FastAPI API engine & SQLAlchemy models
│   ├── app/
│   │   ├── api/v1/    # Versioned API routes (auth, vault, tags, settings, backup)
│   │   ├── core/      # Security, Argon2id, PyJWT, config
│   │   ├── database/  # Async database session & engine
│   │   ├── models/    # SQLAlchemy 2.0 ORM models
│   │   └── schemas/   # Pydantic v2 validation schemas
│   └── tests/         # Pytest automated test suite
├── frontend/           # React + Vite + TypeScript web application
├── crypto.py           # Legacy CLI helper
├── database.py         # Legacy CLI DB helper
├── manager.py          # Legacy CLI manager
├── main.py             # Legacy CLI interface
└── README.md
```

## Getting Started

### Backend Setup
```bash
# Navigate to backend directory and install dependencies
pip install -r backend/requirements.txt

# Run backend development server
PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations (Alembic)
```bash
# Run migrations on local/production database
cd backend
python -m alembic upgrade head
```

### Running Backend Tests
```bash
PYTHONPATH=backend python -m pytest backend/tests
```

## Production Deployment Guide

For detailed step-by-step instructions on deploying the frontend to **Vercel**, the backend to **Render/Railway**, and setting up managed **PostgreSQL**, please refer to [`docs/deployment.md`](file:///c:/Users/rajki/Desktop/coding/password/Bitwarden/docs/deployment.md).

