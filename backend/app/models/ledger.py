from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class DecisionLedger(Base):
    __tablename__ = "decision_ledger"

    id = Column(String, primary_key=True, index=True) # e.g. "DEC-1048"
    mandate_id = Column(String, nullable=False, index=True)
    agent_id = Column(String, nullable=False, index=True)
    product_id = Column(String, nullable=False, index=True)
    product_name = Column(String, nullable=False)
    
    # Financial snapshot
    quantity = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    
    # Buyer context & alternatives
    buyer_prompt = Column(Text, nullable=True)
    products_evaluated_count = Column(Integer, default=0)
    top_candidates = Column(JSON, default=list) # List of evaluated candidate products & match %
    selection_rationale = Column(JSON, default=list) # e.g. ["Within budget", "ANC verified", "Highest match"]
    trade_off = Column(String, nullable=True) # e.g. "₹700 more than AudioCore X2 but includes ANC and 32h battery"
    
    # Deterministic policy breakdown
    rules_evaluated = Column(JSON, default=list) # [{rule: "agent_active", passed: true, detail: "Agent agent_42 is ACTIVE"}]
    decision = Column(String, nullable=False) # "APPROVED", "DECLINED", "HUMAN_APPROVAL_REQUIRED"
    decision_reason = Column(Text, nullable=False)
    
    # Payment execution (Razorpay)
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    payment_status = Column(String, default="NOT_INITIATED") # "NOT_INITIATED", "PENDING", "SUCCESS", "FAILED"
    razorpay_called = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
