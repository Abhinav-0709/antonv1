from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import MerchantPolicy, Product, Agent
from app.schemas.policy import (
    PolicyResponse, PolicyUpdate, PolicySimulationRequest,
    PolicySimulationResponse, PolicySimulationRuleResult
)

router = APIRouter(prefix="/policies", tags=["Merchant Policies"])

@router.get("", response_model=PolicyResponse)
def get_merchant_policy(db: Session = Depends(get_db)):
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.id == "default_policy").first()
    if not policy:
        policy = MerchantPolicy()
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy

@router.put("", response_model=PolicyResponse)
def update_merchant_policy(update: PolicyUpdate, db: Session = Depends(get_db)):
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.id == "default_policy").first()
    if not policy:
        policy = MerchantPolicy()
        db.add(policy)

    update_dict = update.model_dump(exclude_unset=True)
    for k, v in update_dict.items():
        setattr(policy, k, v)

    db.commit()
    db.refresh(policy)
    return policy

@router.post("/simulate", response_model=PolicySimulationResponse)
def simulate_policy_mandate(req: PolicySimulationRequest, db: Session = Depends(get_db)):
    """
    Allows a merchant to simulate hypothetical purchase mandates against active or draft rules
    without touching the live ledger or payment layer.
    """
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.id == "default_policy").first()
    product = db.query(Product).filter(Product.id == req.product_id).first()
    agent = db.query(Agent).filter(Agent.id == req.agent_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found for simulation")

    # Apply temporary simulation overrides if provided
    max_amount_limit = (
        req.custom_policy_override.max_autonomous_transaction_limit
        if (req.custom_policy_override and req.custom_policy_override.max_autonomous_transaction_limit is not None)
        else (policy.max_autonomous_transaction_limit if policy else 50000.0)
    )
    max_qty_limit = (
        req.custom_policy_override.max_quantity_per_order
        if (req.custom_policy_override and req.custom_policy_override.max_quantity_per_order is not None)
        else (policy.max_quantity_per_order if policy else 3)
    )
    allowed_cats = (
        req.custom_policy_override.allowed_categories
        if (req.custom_policy_override and req.custom_policy_override.allowed_categories is not None)
        else (policy.allowed_categories if policy else [])
    )
    blocked_cats = (
        req.custom_policy_override.blocked_categories
        if (req.custom_policy_override and req.custom_policy_override.blocked_categories is not None)
        else (policy.blocked_categories if policy else [])
    )

    total_amount = product.price * req.quantity
    rule_results = []
    is_declined = False
    requires_human = False

    # Rule 1: Agent active
    agent_active = agent and agent.status == "ACTIVE"
    rule_results.append(PolicySimulationRuleResult(
        rule_name="Agent Status",
        passed=agent_active,
        description=f"Agent '{agent.id if agent else 'Unknown'}' is {agent.status if agent else 'Not Found'}",
        actual_value=agent.status if agent else "NOT_FOUND",
        allowed_threshold="ACTIVE"
    ))
    if not agent_active:
        is_declined = True

    # Rule 2: AI Purchasable
    rule_results.append(PolicySimulationRuleResult(
        rule_name="AI Purchasable Flag",
        passed=product.agent_purchasable,
        description="Product is eligible for autonomous agent purchase",
        actual_value=product.agent_purchasable,
        allowed_threshold=True
    ))
    if not product.agent_purchasable:
        is_declined = True

    # Rule 3: Category
    cat_allowed = (not allowed_cats or product.category in allowed_cats) and (product.category not in blocked_cats)
    rule_results.append(PolicySimulationRuleResult(
        rule_name="Category Policy",
        passed=cat_allowed,
        description=f"Product category '{product.category}'",
        actual_value=product.category,
        allowed_threshold=f"Allowed: {allowed_cats}"
    ))
    if not cat_allowed:
        is_declined = True

    # Rule 4: Quantity Limit
    qty_passed = req.quantity <= max_qty_limit
    rule_results.append(PolicySimulationRuleResult(
        rule_name="Quantity Limit",
        passed=qty_passed,
        description=f"Requested {req.quantity} units",
        actual_value=req.quantity,
        allowed_threshold=f"<= {max_qty_limit}"
    ))
    if not qty_passed:
        is_declined = True

    # Rule 5: Transaction Spending Limit
    amount_passed = total_amount <= max_amount_limit
    rule_results.append(PolicySimulationRuleResult(
        rule_name="Transaction Limit",
        passed=amount_passed,
        description=f"Transaction total ₹{total_amount:,.2f}",
        actual_value=total_amount,
        allowed_threshold=f"<= ₹{max_amount_limit:,.2f}"
    ))
    if not amount_passed:
        is_declined = True

    # Rule 6: Human Approval Trigger
    if product.requires_human_confirmation:
        requires_human = True

    if is_declined:
        decision = "DECLINED"
        summary = "Simulation resulted in DECLINE: One or more merchant constraints failed."
    elif requires_human:
        decision = "HUMAN_APPROVAL_REQUIRED"
        summary = "Simulation resulted in HUMAN APPROVAL: Requires manual sign-off."
    else:
        decision = "APPROVED"
        summary = "Simulation resulted in APPROVE: All policy boundaries satisfied."

    return PolicySimulationResponse(
        overall_decision=decision,
        summary=summary,
        evaluated_amount=total_amount,
        rules=rule_results
    )
