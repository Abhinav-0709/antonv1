from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class PolicyBase(BaseModel):
    id: str = "default_policy"
    merchant_name: str = "Acme Electronics & Tech"
    max_autonomous_transaction_limit: float = 50000.0
    daily_spend_limit_per_agent: float = 100000.0
    human_approval_threshold: float = 50000.0
    max_quantity_per_order: int = 3
    allowed_categories: List[str] = Field(default_factory=lambda: ["Electronics", "Audio", "Accessories", "Peripherals"])
    blocked_categories: List[str] = Field(default_factory=lambda: ["Gift Cards", "Subscriptions", "Pre-orders"])
    require_verified_agent: bool = True
    allow_autonomous_checkout: bool = True

class PolicyUpdate(BaseModel):
    merchant_name: Optional[str] = None
    max_autonomous_transaction_limit: Optional[float] = None
    daily_spend_limit_per_agent: Optional[float] = None
    human_approval_threshold: Optional[float] = None
    max_quantity_per_order: Optional[int] = None
    allowed_categories: Optional[List[str]] = None
    blocked_categories: Optional[List[str]] = None
    require_verified_agent: Optional[bool] = None
    allow_autonomous_checkout: Optional[bool] = None

class PolicyResponse(PolicyBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PolicySimulationRequest(BaseModel):
    agent_id: str = "agent_42"
    product_id: str
    quantity: int = 1
    custom_policy_override: Optional[PolicyUpdate] = None

class PolicySimulationRuleResult(BaseModel):
    rule_name: str
    passed: bool
    description: str
    actual_value: Any
    allowed_threshold: Any

class PolicySimulationResponse(BaseModel):
    overall_decision: str # "APPROVED", "DECLINED", "HUMAN_APPROVAL_REQUIRED"
    summary: str
    evaluated_amount: float
    rules: List[PolicySimulationRuleResult]
