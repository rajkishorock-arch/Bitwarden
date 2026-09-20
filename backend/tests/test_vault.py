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
async def test_vault_crud_flow_and_user_isolation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register and Login User A
        reg_a = {
            "email": "usera@example.com",
            "auth_hash": "usera_auth_hash_123456789",
            "auth_salt": "salt_a",
            "vault_salt": "vault_salt_a",
            "kdf_iterations": 600000
        }
        await ac.post("/api/v1/auth/register", json=reg_a)
        login_a = await ac.post("/api/v1/auth/login", json={"email": "usera@example.com", "auth_hash": "usera_auth_hash_123456789"})
        token_a = login_a.cookies.get("access_token")
        csrf_a = login_a.cookies.get("csrf_token")

        # 2. User A Creates Encrypted Vault Item
        item_payload = {
            "item_type": "login",
            "title_encrypted": "U2FsdGVkX19TITLE==",
            "payload_encrypted": "U2FsdGVkX19PAYLOAD==",
            "nonce": "NONCE1234567890==",
            "is_favorite": True
        }
        create_res = await ac.post(
            "/api/v1/vault/items",
            cookies={"access_token": token_a, "csrf_token": csrf_a},
            headers={"X-CSRF-Token": csrf_a},
            json=item_payload
        )
        assert create_res.status_code == 201
        item_a = create_res.json()
        item_id = item_a["id"]
        assert item_a["title_encrypted"] == "U2FsdGVkX19TITLE=="
        assert item_a["is_favorite"] is True

        # 3. User A Reads Vault Items
        list_res = await ac.get("/api/v1/vault/items", cookies={"access_token": token_a})
        assert list_res.status_code == 200
        assert len(list_res.json()) == 1

        # 4. Register and Login User B
        reg_b = {
            "email": "userb@example.com",
            "auth_hash": "userb_auth_hash_987654321",
            "auth_salt": "salt_b",
            "vault_salt": "vault_salt_b",
            "kdf_iterations": 600000
        }
        await ac.post("/api/v1/auth/register", json=reg_b)
        login_b = await ac.post("/api/v1/auth/login", json={"email": "userb@example.com", "auth_hash": "userb_auth_hash_987654321"})
        token_b = login_b.cookies.get("access_token")
        csrf_b = login_b.cookies.get("csrf_token")

        # 5. User B List Items -> must be empty
        list_b_res = await ac.get("/api/v1/vault/items", cookies={"access_token": token_b})
        assert list_b_res.status_code == 200
        assert len(list_b_res.json()) == 0

        # 6. User B Tries to Read User A's Item -> 404 Not Found
        get_b = await ac.get(f"/api/v1/vault/items/{item_id}", cookies={"access_token": token_b})
        assert get_b.status_code == 404

        # 7. User B Tries to Update User A's Item -> 404 Not Found
        update_b = await ac.put(
            f"/api/v1/vault/items/{item_id}",
            cookies={"access_token": token_b, "csrf_token": csrf_b},
            headers={"X-CSRF-Token": csrf_b},
            json={"title_encrypted": "ATTACKER_TITLE"}
        )
        assert update_b.status_code == 404

        # 8. User B Tries to Delete User A's Item -> 404 Not Found
        del_b = await ac.delete(
            f"/api/v1/vault/items/{item_id}",
            cookies={"access_token": token_b, "csrf_token": csrf_b},
            headers={"X-CSRF-Token": csrf_b}
        )
        assert del_b.status_code == 404

        # 9. User A Deletes Item Successfully
        del_a = await ac.delete(
            f"/api/v1/vault/items/{item_id}",
            cookies={"access_token": token_a, "csrf_token": csrf_a},
            headers={"X-CSRF-Token": csrf_a}
        )
        assert del_a.status_code == 200

        # 10. Confirm Item Deleted
        list_a_after = await ac.get("/api/v1/vault/items", cookies={"access_token": token_a})
        assert len(list_a_after.json()) == 0

@pytest.mark.asyncio
async def test_plaintext_sentinel_leakage():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        reg_payload = {
            "email": "sentinel@example.com",
            "auth_hash": "sentinel_auth_hash_123456789",
            "auth_salt": "salt_sentinel",
            "vault_salt": "vault_salt_sentinel",
            "kdf_iterations": 600000
        }
        await ac.post("/api/v1/auth/register", json=reg_payload)
        login_res = await ac.post("/api/v1/auth/login", json={"email": "sentinel@example.com", "auth_hash": "sentinel_auth_hash_123456789"})
        token = login_res.cookies.get("access_token")
        csrf = login_res.cookies.get("csrf_token")

        sentinels = ["TEST_PASSWORD_123", "TEST_CARD_NUMBER_456", "TEST_SECRET_NOTE_789"]

        # Encrypted payload simulation (Base64 ciphertext)
        item_payload = {
            "item_type": "login",
            "title_encrypted": "eyJhY2NvdW50Ijoic2VudGluZWwifQ==",
            "payload_encrypted": "ZXlKMGIzSmxZVzFsY3lJNkluaHRjM0JsYkhWdWZRPT0=",
            "nonce": "ZXlKMGIzSmxZVzFsY3lJ==",
            "is_favorite": False
        }

        create_res = await ac.post(
            "/api/v1/vault/items",
            cookies={"access_token": token, "csrf_token": csrf},
            headers={"X-CSRF-Token": csrf},
            json=item_payload
        )
        assert create_res.status_code == 201

        # Query raw database table directly
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac_check:
            items_res = await ac_check.get("/api/v1/vault/items", cookies={"access_token": token})
            raw_item = items_res.json()[0]

            for sentinel in sentinels:
                assert sentinel not in raw_item["title_encrypted"]
                assert sentinel not in raw_item["payload_encrypted"]
                assert sentinel not in raw_item["nonce"]
                assert sentinel not in str(raw_item)

