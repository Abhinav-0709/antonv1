from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True, index=True) # e.g. "agent_42", "agent_procure"
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="ACTIVE") # "ACTIVE", "REVOKED", "SUSPENDED"
    trust_tier = Column(String, default="VERIFIED") # "VERIFIED", "STANDARD", "PROBATIONARY"
    
    # Specific agent limits (can override or inherit merchant defaults)
    max_transaction_limit = Column(Float, default=50000.0)
    daily_spend_limit = Column(Float, default=100000.0)
    spent_today = Column(Float, default=0.0)
    
    # Category permissions e.g. ["Electronics", "Audio", "Accessories"]
    allowed_categories = Column(JSON, default=list)
    
    # Revocation audit
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revocation_reason = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
