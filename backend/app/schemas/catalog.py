from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class ProductBase(BaseModel):
    id: str
    name: str
    description: str
    price: float
    currency: str = "INR"
    stock: int
    category: str
    attributes: Dict[str, Any] = Field(default_factory=dict)
    agent_purchasable: bool = True
    requires_human_confirmation: bool = False
    max_quantity_per_agent_order: int = 5
    image_url: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class AgentReadableCatalogSpec(BaseModel):
    merchant_name: str
    currency: str
    protocol_version: str = "1.0.0"
    endpoints: Dict[str, str]
    purchase_rules_summary: Dict[str, Any]
    products: List[ProductResponse]
