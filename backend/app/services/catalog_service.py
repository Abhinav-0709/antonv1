from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.catalog import Product
from app.models.policy import MerchantPolicy
from app.schemas.catalog import ProductResponse, AgentReadableCatalogSpec

class CatalogService:
    @staticmethod
    def get_all_products(
        db: Session,
        category: Optional[str] = None,
        agent_purchasable_only: bool = False,
        search: Optional[str] = None
    ) -> List[Product]:
        query = db.query(Product)
        if category:
            query = query.filter(Product.category.ilike(f"%{category}%"))
        if agent_purchasable_only:
            query = query.filter(Product.agent_purchasable == True)
        if search:
            query = query.filter(
                (Product.name.ilike(f"%{search}%")) |
                (Product.description.ilike(f"%{search}%")) |
                (Product.category.ilike(f"%{search}%"))
            )
        return query.all()

    @staticmethod
    def get_product_by_id(db: Session, product_id: str) -> Optional[Product]:
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def get_agent_spec(db: Session, base_url: str = "http://localhost:8000") -> AgentReadableCatalogSpec:
        policy = db.query(MerchantPolicy).filter(MerchantPolicy.id == "default_policy").first()
        products = db.query(Product).filter(Product.agent_purchasable == True).all()

        return AgentReadableCatalogSpec(
            merchant_name=policy.merchant_name if policy else "Acme Electronics",
            currency="INR",
            protocol_version="1.0.0",
            endpoints={
                "catalog": f"{base_url}/api/catalog",
                "intent_parser": f"{base_url}/api/intent/parse",
                "evaluate": f"{base_url}/api/products/evaluate",
                "mandates": f"{base_url}/api/mandates",
                "evaluate_mandate": f"{base_url}/api/mandates/{{id}}/evaluate",
                "ledger": f"{base_url}/api/ledger",
                "passport": f"{base_url}/api/passport/{{transaction_id}}"
            },
            purchase_rules_summary={
                "max_autonomous_amount": policy.max_autonomous_transaction_limit if policy else 50000.0,
                "daily_limit_per_agent": policy.daily_spend_limit_per_agent if policy else 100000.0,
                "max_quantity_per_order": policy.max_quantity_per_order if policy else 3,
                "allowed_categories": policy.allowed_categories if policy else [],
                "blocked_categories": policy.blocked_categories if policy else []
            },
            products=[ProductResponse.model_validate(p) for p in products]
        )
