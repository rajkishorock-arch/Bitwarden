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
async def test_tag_lifecycle_security_and_user_isolation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register User A & User B
        user_a = {"email": "taga@example.com", "auth_hash": "hash_a_1234567890123456", "auth_salt": "salt_a", "vault_salt": "vs_a", "kdf_iterations": 600000}
        user_b = {"email": "tagb@example.com", "auth_hash": "hash_b_1234567890123456", "auth_salt": "salt_b", "vault_salt": "vs_b", "kdf_iterations": 600000}
        
        reg_a = await ac.post("/api/v1/auth/register", json=user_a)
        assert reg_a.status_code == 201
        reg_b = await ac.post("/api/v1/auth/register", json=user_b)
        assert reg_b.status_code == 201
        
        # User A login
        login_a = await ac.post("/api/v1/auth/login", json={"email": user_a["email"], "auth_hash": user_a["auth_hash"]})
        assert login_a.status_code == 200
        token_a = login_a.cookies.get("access_token")
        csrf_a = login_a.cookies.get("csrf_token")

        # 2. Tag Creation without CSRF header -> 403 Forbidden
        create_no_csrf = await ac.post(
            "/api/v1/tags",
            cookies={"access_token": token_a, "csrf_token": csrf_a},
            json={"name": "Work", "color": "#ff0000"}
        )
        assert create_no_csrf.status_code == 403

        # 3. Tag Creation with CSRF -> 201 Created
        create_res_a = await ac.post(
            "/api/v1/tags",
            cookies={"access_token": token_a, "csrf_token": csrf_a},
            headers={"X-CSRF-Token": csrf_a},
            json={"name": "Work", "color": "#ff0000"}
        )
        assert create_res_a.status_code == 201
        tag_a = create_res_a.json()
        tag_a_id = tag_a["id"]
        assert tag_a["name"] == "Work"

        # 4. Duplicate Tag Rejection (case insensitive) -> 400 Bad Request
        dup_res = await ac.post(
            "/api/v1/tags",
            cookies={"access_token": token_a, "csrf_token": csrf_a},
            headers={"X-CSRF-Token": csrf_a},
            json={"name": "work", "color": "#00ff00"}
        )
        assert dup_res.status_code == 400
        assert "already exists" in dup_res.json()["detail"].lower()

        # 5. User B login
        login_b = await ac.post("/api/v1/auth/login", json={"email": user_b["email"], "auth_hash": user_b["auth_hash"]})
        assert login_b.status_code == 200
        token_b = login_b.cookies.get("access_token")
        csrf_b = login_b.cookies.get("csrf_token")

        # User B creating same tag name -> 201 Created (isolated per user)
        create_res_b = await ac.post(
            "/api/v1/tags",
            cookies={"access_token": token_b, "csrf_token": csrf_b},
            headers={"X-CSRF-Token": csrf_b},
            json={"name": "Work", "color": "#0000ff"}
        )
        assert create_res_b.status_code == 201

        # 6. IDOR Check: User B tries to modify User A's tag -> 404 Not Found
        update_b_res = await ac.put(
            f"/api/v1/tags/{tag_a_id}",
            cookies={"access_token": token_b, "csrf_token": csrf_b},
            headers={"X-CSRF-Token": csrf_b},
            json={"name": "Hacked Tag"}
        )
        assert update_b_res.status_code == 404

        # 7. IDOR Check: User B tries to delete User A's tag -> 404 Not Found
        del_b_res = await ac.delete(
            f"/api/v1/tags/{tag_a_id}",
            cookies={"access_token": token_b, "csrf_token": csrf_b},
            headers={"X-CSRF-Token": csrf_b}
        )
        assert del_b_res.status_code == 404

        # 8. Tag Rename by User A -> 200 OK
        rename_a_res = await ac.put(
            f"/api/v1/tags/{tag_a_id}",
            cookies={"access_token": token_a, "csrf_token": csrf_a},
            headers={"X-CSRF-Token": csrf_a},
            json={"name": "Office", "color": "#123456"}
        )
        assert rename_a_res.status_code == 200
        assert rename_a_res.json()["name"] == "Office"

        # 9. Tag Delete by User A without CSRF header -> 403 Forbidden
        del_a_no_csrf = await ac.delete(
            f"/api/v1/tags/{tag_a_id}",
            cookies={"access_token": token_a, "csrf_token": csrf_a}
        )
        assert del_a_no_csrf.status_code == 403

        # 10. Tag Delete by User A with CSRF -> 200 OK
        del_a_res = await ac.delete(
            f"/api/v1/tags/{tag_a_id}",
            cookies={"access_token": token_a, "csrf_token": csrf_a},
            headers={"X-CSRF-Token": csrf_a}
        )
        assert del_a_res.status_code == 200

        # 11. List Tags for User A -> 0 tags left; User B still has 1 tag
        list_a = await ac.get("/api/v1/tags", cookies={"access_token": token_a})
        assert len(list_a.json()) == 0

        list_b = await ac.get("/api/v1/tags", cookies={"access_token": token_b})
        assert len(list_b.json()) == 1
