from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class MandateCreateRequest(BaseModel):
    agent_id: str = "agent_42"
    product_id: str
    quantity: int = 1
    max_budget: float
    buyer_prompt: Optional[str] = None
    structured_intent: Optional[Dict[str, Any]] = None
    products_evaluated_count: int = 0
    top_candidates: List[Dict[str, Any]] = Field(default_factory=list)
    selection_rationale: List[str] = Field(default_factory=list)
    trade_off: Optional[str] = None

class MandateRuleEvaluation(BaseModel):
    rule: str
    label: str
    passed: bool
    detail: str

class MandateEvaluationResult(BaseModel):
    mandate_id: str
    decision: str # "APPROVED", "DECLINED", "HUMAN_APPROVAL_REQUIRED"
    decision_reason: str
    rules: List[MandateRuleEvaluation]
    amount: float
    product_name: str
    next_options: List[str] = Field(default_factory=list)
    suggested_alternative_product_id: Optional[str] = None

class MandateResponse(BaseModel):
    id: str
    agent_id: str
    product_id: str
    quantity: int
    unit_price: float
    total_amount: float
    max_budget: float
    currency: str
    buyer_prompt: Optional[str]
    status: str
    evaluation_result: Optional[Dict[str, Any]]
    decline_reason: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)
