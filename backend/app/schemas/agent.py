from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class AgentBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str = "ACTIVE"
    trust_tier: str = "VERIFIED"
    max_transaction_limit: float = 50000.0
    daily_spend_limit: float = 100000.0
    spent_today: float = 0.0
    allowed_categories: List[str] = Field(default_factory=list)

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    trust_tier: Optional[str] = None
    max_transaction_limit: Optional[float] = None
    daily_spend_limit: Optional[float] = None
    allowed_categories: Optional[List[str]] = None
    revocation_reason: Optional[str] = None

class AgentResponse(AgentBase):
    revoked_at: Optional[datetime] = None
    revocation_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AgentRevokeRequest(BaseModel):
    reason: str = Field(default="Revoked by merchant administrator", description="Reason for revoking agent access")
