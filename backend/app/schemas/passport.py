from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime

class CandidateSummary(BaseModel):
    product_id: str
    name: str
    price: float
    match_score: float

class GroundedFactor(BaseModel):
    label: str
    description: str
    status: str = "VERIFIED" # "VERIFIED", "WARNING", "NOTE"

class PurchasePassportResponse(BaseModel):
    passport_id: str
    transaction_id: str
    product_name: str
    amount: float
    currency: str
    buyer_request: str
    products_evaluated_count: int
    top_candidates: List[CandidateSummary]
    why_selected: List[str]
    trade_offs: Optional[str]
    authorization_summary: List[GroundedFactor]
    payment_status: str
    payment_method: str = "Razorpay Test Mode"
    razorpay_order_id: Optional[str]
    razorpay_payment_id: Optional[str]
    timestamp: datetime
    merchant_name: str
