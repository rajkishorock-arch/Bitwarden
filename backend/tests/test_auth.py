import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import engine, Base

@pytest_asyncio.fixture(autouse=True)
async def prepare_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_register_successful():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg_payload = {
            "email": "alice@example.com",
            "auth_hash": "alice_secret_auth_hash_123456",
            "auth_salt": "auth_salt_hex_123",
            "vault_salt": "vault_salt_hex_456",
            "kdf_iterations": 600000
        }
        response = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "alice@example.com"
        assert data["auth_salt"] == "auth_salt_hex_123"
        assert data["vault_salt"] == "vault_salt_hex_456"
        assert "id" in data

@pytest.mark.asyncio
async def test_register_duplicate_email():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg_payload = {
            "email": "duplicate@example.com",
            "auth_hash": "auth_hash_secret_123456789",
            "auth_salt": "auth_salt_123",
            "vault_salt": "vault_salt_456",
            "kdf_iterations": 600000
        }
        res1 = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res1.status_code == 201

        res2 = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res2.status_code == 400
        assert "already exists" in res2.json()["detail"]

@pytest.mark.asyncio
async def test_login_successful_and_cookies_set():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg_payload = {
            "email": "bob@example.com",
            "auth_hash": "bob_secret_auth_hash_999999",
            "auth_salt": "auth_salt_bob",
            "vault_salt": "vault_salt_bob",
            "kdf_iterations": 600000
        }
        await ac.post("/api/v1/auth/register", json=reg_payload)

        login_payload = {
            "email": "bob@example.com",
            "auth_hash": "bob_secret_auth_hash_999999"
        }
        response = await ac.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == 200
        token_data = response.json()
        assert "access_token" in token_data
        assert "csrf_token" in token_data
        assert token_data["email"] == "bob@example.com"
        assert "access_token" in response.cookies
        assert "csrf_token" in response.cookies

@pytest.mark.asyncio
async def test_login_invalid_credentials():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg_payload = {
            "email": "charlie@example.com",
            "auth_hash": "correct_secret_auth_hash_123",
            "auth_salt": "auth_salt",
            "vault_salt": "vault_salt",
            "kdf_iterations": 600000
        }
        await ac.post("/api/v1/auth/register", json=reg_payload)

        login_payload = {
            "email": "charlie@example.com",
            "auth_hash": "WRONG_secret_auth_hash_999"
        }
        response = await ac.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == 401
        assert "Invalid email or authentication key" in response.json()["detail"]

@pytest.mark.asyncio
async def test_authenticated_get_me_via_cookie():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg_payload = {
            "email": "dave@example.com",
            "auth_hash": "dave_secret_auth_hash_123456",
            "auth_salt": "auth_salt",
            "vault_salt": "vault_salt",
            "kdf_iterations": 600000
        }
        res_reg = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res_reg.status_code == 201

        login_res = await ac.post("/api/v1/auth/login", json={"email": "dave@example.com", "auth_hash": "dave_secret_auth_hash_123456"})
        assert login_res.status_code == 200
        access_token = login_res.cookies.get("access_token")

        # Request using access_token cookie
        response = await ac.get("/api/v1/auth/me", cookies={"access_token": access_token})
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["email"] == "dave@example.com"

@pytest.mark.asyncio
async def test_unauthenticated_request_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/auth/me")
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_logout_clears_session():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg_payload = {
            "email": "eve@example.com",
            "auth_hash": "eve_secret_auth_hash_123456",
            "auth_salt": "auth_salt",
            "vault_salt": "vault_salt",
            "kdf_iterations": 600000
        }
        res_reg = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res_reg.status_code == 201

        login_res = await ac.post("/api/v1/auth/login", json={"email": "eve@example.com", "auth_hash": "eve_secret_auth_hash_123456"})
        assert login_res.status_code == 200
        access_token = login_res.cookies.get("access_token")
        csrf_token = login_res.cookies.get("csrf_token")

        logout_res = await ac.post(
            "/api/v1/auth/logout",
            cookies={"access_token": access_token, "csrf_token": csrf_token},
            headers={"X-CSRF-Token": csrf_token}
        )
        assert logout_res.status_code == 200
        assert logout_res.json()["message"] == "Successfully logged out"

@pytest.mark.asyncio
async def test_csrf_protection_state_changing_request():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg_payload = {
            "email": "csrf_test@example.com",
            "auth_hash": "csrf_secret_auth_hash_123456",
            "auth_salt": "auth_salt",
            "vault_salt": "vault_salt",
            "kdf_iterations": 600000
        }
        await ac.post("/api/v1/auth/register", json=reg_payload)

        login_res = await ac.post("/api/v1/auth/login", json={"email": "csrf_test@example.com", "auth_hash": "csrf_secret_auth_hash_123456"})
        access_token = login_res.cookies.get("access_token")
        csrf_token = login_res.cookies.get("csrf_token")

        # 1. GET requests succeed without CSRF token
        get_res = await ac.get("/api/v1/auth/me", cookies={"access_token": access_token})
        assert get_res.status_code == 200

        # 2. State-changing request WITHOUT CSRF token -> rejected (403)
        bad_logout_no_header = await ac.post("/api/v1/auth/logout", cookies={"access_token": access_token})
        assert bad_logout_no_header.status_code == 403
        assert "CSRF token validation failed" in bad_logout_no_header.json()["detail"]

        # 3. State-changing request WITH INVALID CSRF token -> rejected (403)
        bad_logout_wrong_token = await ac.post(
            "/api/v1/auth/logout",
            cookies={"access_token": access_token, "csrf_token": csrf_token},
            headers={"X-CSRF-Token": "INVALID_CSRF_TOKEN_STRING"}
        )
        assert bad_logout_wrong_token.status_code == 403
        assert "CSRF token validation failed" in bad_logout_wrong_token.json()["detail"]

        # 4. State-changing request WITH VALID CSRF token -> succeeds (200)
        good_logout = await ac.post(
            "/api/v1/auth/logout",
            cookies={"access_token": access_token, "csrf_token": csrf_token},
            headers={"X-CSRF-Token": csrf_token}
        )
        assert good_logout.status_code == 200

@pytest.mark.asyncio
async def test_csrf_protection_put_patch_delete_methods():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg_payload = {
            "email": "csrf_methods@example.com",
            "auth_hash": "csrf_secret_auth_hash_123456",
            "auth_salt": "auth_salt",
            "vault_salt": "vault_salt",
            "kdf_iterations": 600000
        }
        await ac.post("/api/v1/auth/register", json=reg_payload)

        login_res = await ac.post("/api/v1/auth/login", json={"email": "csrf_methods@example.com", "auth_hash": "csrf_secret_auth_hash_123456"})
        access_token = login_res.cookies.get("access_token")
        csrf_token = login_res.cookies.get("csrf_token")

        # PUT without CSRF -> 403
        put_res = await ac.put("/api/v1/settings", cookies={"access_token": access_token}, json={"auto_lock_minutes": 10})
        assert put_res.status_code == 403

        # PUT with valid CSRF -> succeeds (200)
        put_good = await ac.put(
            "/api/v1/settings",
            cookies={"access_token": access_token, "csrf_token": csrf_token},
            headers={"X-CSRF-Token": csrf_token},
            json={"auto_lock_minutes": 10}
        )
        assert put_good.status_code == 200

@pytest.mark.asyncio
async def test_cors_headers():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            }
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
        assert response.headers.get("access-control-allow-credentials") == "true"

