import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Anton — Agent Commerce Gateway"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./gateway.db"
    
    # Razorpay credentials (test mode)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_mock_key_12345")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "mock_secret_key_67890")
    RAZORPAY_CURRENCY: str = "INR"
    
    # AI intent parser / LLM configuration (optional external key; fallback to deterministic fuzzy matching)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
