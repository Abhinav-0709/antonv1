from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed import seed_database

# Import routers
from app.routers import catalog, intent, mandates, policies, agents, ledger, payments, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed data on startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Merchant-side authorization and trust layer between AI buyers and Razorpay commerce.",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers under /api
app.include_router(catalog.router, prefix=settings.API_V1_STR)
app.include_router(intent.router, prefix=settings.API_V1_STR)
app.include_router(mandates.router, prefix=settings.API_V1_STR)
app.include_router(policies.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(ledger.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "product": "Anton — Agent Commerce Gateway",
        "mantra": "AI proposes. Policy decides. Razorpay executes. The ledger remembers.",
        "status": "operational",
        "docs_url": "/docs",
        "agent_spec_url": f"{settings.API_V1_STR}/catalog/agent-spec"
    }
