# VaultGuard Production Deployment Guide

This document outlines the step-by-step production deployment process for VaultGuard.

## Production Architecture Overview

- **Frontend**: React + Vite + TypeScript hosted on **Vercel**
- **Backend**: FastAPI + Async SQLAlchemy hosted on **Render** (or Railway)
- **Database**: Managed **PostgreSQL** instance (Neon, Supabase, AWS RDS, or Render PostgreSQL)
- **Session Architecture**: Cross-Domain HTTP-Only, Secure, SameSite=none (or SameSite=lax if reverse-proxied under same apex domain) Cookies with `credentials: 'include'`. Zero tokens in browser `localStorage`.

---

## Deployment Steps

### 1. Provision Production PostgreSQL Database
- Create a managed PostgreSQL database (e.g. Supabase, Neon, Railway, or Render PostgreSQL).
- Obtain the connection URI (must use `postgresql+asyncpg://user:pass@host:port/dbname`).
- Ensure SSL mode is enabled (`?ssl=require` or `sslmode=require`).

### 2. Configure Backend Environment Variables
In Render / Railway control panel, set the following environment variables:
- `ENVIRONMENT`: `production`
- `DATABASE_URL`: `postgresql+asyncpg://<db_user>:<db_password>@<db_host>:<db_port>/<db_name>?ssl=require`
- `SECRET_KEY`: `<generate-a-strong-random-64-char-hex-secret>`
- `CORS_ORIGINS`: `["https://<your-frontend-app>.vercel.app"]`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: `30`
- `REFRESH_TOKEN_EXPIRE_DAYS`: `7`
- `PORT`: `10000` (assigned automatically by host)

### 3. Run Alembic Database Migrations
Run the initial database migration against the production PostgreSQL instance before or during backend deployment:
```bash
cd backend
python -m alembic upgrade head
```

### 4. Deploy FastAPI Backend
- Set Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 5. Verify Backend Health Endpoint
Test the public health endpoint:
```bash
curl -i https://<your-backend-api>.onrender.com/health
```
Expected output:
```json
{"status": "ok", "project": "VaultGuard API"}
```

### 6. Configure Frontend Environment Variables
In Vercel dashboard for the frontend project:
- Set Root Directory: `frontend`
- Set `VITE_API_URL`: `https://<your-backend-api>.onrender.com/api/v1`

### 7. Deploy Frontend to Vercel
- Deploy the frontend from GitHub repository.
- SPA routing rewrites are pre-configured in `frontend/vercel.json`.

### 8. Verify Production CORS & Cookie Settings
- Ensure `CORS_ORIGINS` on backend matches the exact Vercel frontend URL: `https://<your-frontend-app>.vercel.app`.
- Ensure cookies issued by backend set `HttpOnly=True`, `Secure=True`, `SameSite=none`, `Path=/`.

### 9. Production E2E Verification Protocol
1. **User Registration**: Register a new user account at `https://<your-frontend-app>.vercel.app/register`.
2. **User Login**: Log in with master password and verify cookie issuance.
3. **Cookie Verification**: Confirm `access_token` and `refresh_token` are set as `HttpOnly` cookies.
4. **LocalStorage Audit**: Verify `localStorage` is completely free of JWT access/refresh tokens.
5. **Vault Operations**: Create, view, update, favorite, and delete encrypted vault items.
6. **Logout Test**: Click Logout and verify session cookies are invalidated and cleared.
7. **Protected Route Check**: Refresh `/app/vault` while logged out to confirm redirect to `/login`.
