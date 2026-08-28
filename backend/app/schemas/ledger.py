from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class DecisionLedgerResponse(BaseModel):
    id: str
    mandate_id: str
    agent_id: str
    product_id: str
    product_name: str
    quantity: int
    amount: float
    currency: str
    buyer_prompt: Optional[str]
    products_evaluated_count: int
    top_candidates: List[Dict[str, Any]]
    selection_rationale: List[str]
    trade_off: Optional[str]
    rules_evaluated: List[Dict[str, Any]]
    decision: str
    decision_reason: str
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    payment_status: str
    razorpay_called: bool
    created_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class LedgerSummaryStats(BaseModel):
    total_decisions: int
    approved_count: int
    declined_count: int
    human_approval_count: int
    total_transacted_volume: float
    active_agents_count: int
