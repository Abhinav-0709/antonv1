from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Mandate(Base):
    __tablename__ = "mandates"

    id = Column(String, primary_key=True, index=True) # e.g. "mandate_1048_abc"
    agent_id = Column(String, ForeignKey("agents.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    
    # Financial parameters
    unit_price = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    max_budget = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    
    # Original buyer prompt / intent context
    buyer_prompt = Column(Text, nullable=True)
    structured_intent = Column(JSON, default=dict)
    
    # Mandate evaluation result
    status = Column(String, default="PENDING") # "PENDING", "APPROVED", "DECLINED", "HUMAN_APPROVAL_REQUIRED"
    evaluation_result = Column(JSON, default=dict) # Granular pass/fail rule details
    decline_reason = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
