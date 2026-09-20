from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

Base = declarative_base()

def create_safe_async_engine():
    db_url = settings.DATABASE_URL
    connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
    try:
        return create_async_engine(
            db_url,
            echo=False,
            future=True,
            connect_args=connect_args
        )
    except Exception as err:
        print(f"[WARNING] Async engine creation failed for '{db_url}': {err}. Falling back to default SQLite.")
        fallback_url = "sqlite+aiosqlite:///./vault.db"
        return create_async_engine(
            fallback_url,
            echo=False,
            future=True,
            connect_args={"check_same_thread": False}
        )

engine = create_safe_async_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as err:
        print(f"[WARNING] init_db schema initialization notice: {err}")

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
