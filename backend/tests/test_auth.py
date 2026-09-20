import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import init_db, engine, Base

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
async def test_register_and_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg_payload = {
            "email": "testuser@example.com",
            "auth_hash": "a_very_secret_client_derived_auth_key_hash_12345",
            "kdf_salt": "random_base64_salt_string==",
            "kdf_iterations": 600000
        }
        res_reg = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res_reg.status_code == 201, res_reg.text
        data = res_reg.json()
        assert data["email"] == "testuser@example.com"
        assert "id" in data

        login_payload = {
            "email": "testuser@example.com",
            "auth_hash": "a_very_secret_client_derived_auth_key_hash_12345"
        }
        res_login = await ac.post("/api/v1/auth/login", json=login_payload)
        assert res_login.status_code == 200, res_login.text
        token_data = res_login.json()
        assert "access_token" in token_data
        assert token_data["email"] == "testuser@example.com"
