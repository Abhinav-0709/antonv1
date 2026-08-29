from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from app.schemas.intent import EvaluationResponse
from app.schemas.passport import PurchasePassportResponse

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user', 'assistant', or 'system'")
    content: str
    candidate_evaluation: Optional[EvaluationResponse] = None
    mandate_proposal: Optional[Dict[str, Any]] = None
    passport_data: Optional[PurchasePassportResponse] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class ChatRequest(BaseModel):
    session_id: Optional[str] = "session_default"
    message: str
    agent_id: str = "agent_42"
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    session_id: str
    reply: str
    candidate_evaluation: Optional[EvaluationResponse] = None
    mandate_proposal: Optional[Dict[str, Any]] = None
    suggested_actions: List[str] = []
