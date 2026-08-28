from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class MerchantPolicy(Base):
    __tablename__ = "merchant_policies"

    id = Column(String, primary_key=True, default="default_policy") # e.g. "default_policy"
    merchant_name = Column(String, default="Acme Electronics & Tech")
    
    # Financial thresholds
    max_autonomous_transaction_limit = Column(Float, default=50000.0) # INR
    daily_spend_limit_per_agent = Column(Float, default=100000.0)
    human_approval_threshold = Column(Float, default=50000.0) # > 50k requires human approval
    
    # Order quantity constraints
    max_quantity_per_order = Column(Integer, default=3)
    
    # Category rules
    allowed_categories = Column(JSON, default=lambda: ["Electronics", "Audio", "Accessories", "Peripherals"])
    blocked_categories = Column(JSON, default=lambda: ["Gift Cards", "Subscriptions", "Pre-orders"])
    
    # Enforcement flags
    require_verified_agent = Column(Boolean, default=True)
    allow_autonomous_checkout = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
