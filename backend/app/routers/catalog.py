from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.catalog_service import CatalogService
from app.schemas.catalog import ProductResponse, AgentReadableCatalogSpec

router = APIRouter(prefix="/catalog", tags=["Catalog"])

@router.get("", response_model=List[ProductResponse])
def get_catalog(
    category: Optional[str] = None,
    agent_purchasable_only: bool = False,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns merchant inventory with machine-readable attributes and AI constraints.
    """
    products = CatalogService.get_all_products(
        db,
        category=category,
        agent_purchasable_only=agent_purchasable_only,
        search=search
    )
    return products

@router.get("/agent-spec", response_model=AgentReadableCatalogSpec)
def get_agent_spec(request: Request, db: Session = Depends(get_db)):
    """
    Returns the agent-readable catalog manifest, purchase policies, and discovery endpoints.
    """
    base_url = str(request.base_url).rstrip("/")
    return CatalogService.get_agent_spec(db, base_url=base_url)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = CatalogService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
