from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class IntentParseRequest(BaseModel):
    query: str = Field(..., description="Natural language purchase request from the buyer")
    agent_id: str = Field(default="agent_42", description="Identifier of the AI buyer agent")
    max_budget: Optional[float] = None

class StructuredIntent(BaseModel):
    category: Optional[str] = None
    target_product_type: str = "item"
    max_price: Optional[float] = None
    quantity: int = 1
    required_features: List[str] = Field(default_factory=list)
    attributes_preference: Dict[str, Any] = Field(default_factory=dict)
    urgency: str = "standard"
    raw_query: str

class CandidateEvaluation(BaseModel):
    product_id: str
    product_name: str
    price: float
    stock: int
    category: str
    match_score: float # 0 to 100
    matched_features: List[str]
    missing_features: List[str]
    in_budget: bool
    agent_purchasable: bool
    trade_off_note: Optional[str] = None
    attributes: Dict[str, Any]

class EvaluationResponse(BaseModel):
    structured_intent: StructuredIntent
    total_catalog_evaluated: int
    top_candidates: List[CandidateEvaluation]
    selected_candidate: Optional[CandidateEvaluation]
    selection_rationale: List[str]
    trade_off_explanation: Optional[str]
