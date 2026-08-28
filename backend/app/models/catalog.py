from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True) # e.g. "prod_soundmax_pro"
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False) # In INR
    currency = Column(String, default="INR")
    stock = Column(Integer, default=0)
    category = Column(String, nullable=False, index=True) # e.g. "Electronics", "Audio"
    
    # Machine-readable structured attributes for AI matching
    # e.g. {"anc": true, "battery_hours": 32, "wireless": true, "brand": "SoundMax", "rating": 4.8}
    attributes = Column(JSON, default=dict)
    
    # Agent commerce constraints
    agent_purchasable = Column(Boolean, default=True)
    requires_human_confirmation = Column(Boolean, default=False)
    max_quantity_per_agent_order = Column(Integer, default=5)
    
    # Machine-readable metadata for discovery
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
