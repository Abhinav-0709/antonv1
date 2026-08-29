import uuid
from typing import List, Tuple, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import Product, MerchantPolicy, Agent, Mandate, DecisionLedger
from app.schemas.mandate import MandateCreateRequest, MandateRuleEvaluation, MandateEvaluationResult

class MandateEngine:
    @staticmethod
    def create_mandate(db: Session, req: MandateCreateRequest) -> Mandate:
        product = db.query(Product).filter(Product.id == req.product_id).first()
        if not product:
            raise ValueError(f"Product {req.product_id} not found in catalog")

        unit_price = product.price
        total_amount = unit_price * req.quantity
        mandate_id = f"mandate_{uuid.uuid4().hex[:8]}"

        mandate = Mandate(
            id=mandate_id,
            agent_id=req.agent_id,
            product_id=req.product_id,
            quantity=req.quantity,
            unit_price=unit_price,
            total_amount=total_amount,
            max_budget=req.max_budget,
            currency=product.currency,
            buyer_prompt=req.buyer_prompt,
            structured_intent=req.structured_intent or {},
            status="PENDING"
        )
        db.add(mandate)
        db.commit()
        db.refresh(mandate)
        return mandate

    @staticmethod
    def evaluate_mandate(
        db: Session,
        mandate: Mandate,
        top_candidates: Optional[List[Dict[str, Any]]] = None,
        selection_rationale: Optional[List[str]] = None,
        trade_off: Optional[str] = None,
        products_evaluated_count: int = 12
    ) -> MandateEvaluationResult:
        """
        100% Deterministic Server-Side Mandate Policy Evaluation.
        Guarantees that the LLM has zero authority over spending decisions.
        """
        policy = db.query(MerchantPolicy).filter(MerchantPolicy.id == "default_policy").first()
        if not policy:
            policy = MerchantPolicy() # Default fallback

        agent = db.query(Agent).filter(Agent.id == mandate.agent_id).first()
        product = db.query(Product).filter(Product.id == mandate.product_id).first()

        rules: List[MandateRuleEvaluation] = []
        is_declined = False
        requires_human = False
        decline_reasons: List[str] = []
        next_options: List[str] = []
        alternative_product_id: Optional[str] = None

        # 1. Agent Status & Revocation Check
        if not agent:
            rules.append(MandateRuleEvaluation(
                rule="agent_registration",
                label="Agent Registered",
                passed=False,
                detail=f"Agent ID '{mandate.agent_id}' is not recognized by this merchant."
            ))
            is_declined = True
            decline_reasons.append("Unregistered buyer agent")
        elif agent.status == "REVOKED":
            rules.append(MandateRuleEvaluation(
                rule="agent_status",
                label="Agent Active Status",
                passed=False,
                detail=f"Agent '{agent.name}' ({agent.id}) is REVOKED. Reason: {agent.revocation_reason or 'Revoked by merchant'}."
            ))
            is_declined = True
            decline_reasons.append("Agent authorization has been revoked by merchant")
        elif agent.status != "ACTIVE":
            rules.append(MandateRuleEvaluation(
                rule="agent_status",
                label="Agent Active Status",
                passed=False,
                detail=f"Agent '{agent.name}' is currently {agent.status}."
            ))
            is_declined = True
            decline_reasons.append(f"Agent is not in ACTIVE state ({agent.status})")
        else:
            rules.append(MandateRuleEvaluation(
                rule="agent_status",
                label="Agent Active Status",
                passed=True,
                detail=f"Agent '{agent.name}' ({agent.id}) is active with {agent.trust_tier} trust tier."
            ))

        # 2. Product Availability & AI Purchasability
        if not product:
            rules.append(MandateRuleEvaluation(
                rule="product_exists",
                label="Product Existence",
                passed=False,
                detail=f"Product '{mandate.product_id}' does not exist in inventory."
            ))
            is_declined = True
            decline_reasons.append("Product not found")
        else:
            if not product.agent_purchasable:
                rules.append(MandateRuleEvaluation(
                    rule="agent_purchasable",
                    label="AI Purchase Allowed",
                    passed=False,
                    detail=f"Product '{product.name}' is marked as restricted from autonomous AI purchasing."
                ))
                is_declined = True
                decline_reasons.append("Product restricted from autonomous AI checkout")
            else:
                rules.append(MandateRuleEvaluation(
                    rule="agent_purchasable",
                    label="AI Purchase Allowed",
                    passed=True,
                    detail=f"Product '{product.name}' is eligible for autonomous agent purchase."
                ))

            if product.stock < mandate.quantity:
                rules.append(MandateRuleEvaluation(
                    rule="inventory_stock",
                    label="Inventory Stock Check",
                    passed=False,
                    detail=f"Insufficient inventory. Requested: {mandate.quantity}, Available: {product.stock}."
                ))
                is_declined = True
                decline_reasons.append("Insufficient merchant stock")
            else:
                rules.append(MandateRuleEvaluation(
                    rule="inventory_stock",
                    label="Inventory Stock Check",
                    passed=True,
                    detail=f"In stock (Requested: {mandate.quantity}, Available: {product.stock})."
                ))

        # 3. Product Category Constraints
        if product:
            category_blocked = product.category in (policy.blocked_categories or [])
            category_allowed = (not policy.allowed_categories) or (product.category in policy.allowed_categories)

            if category_blocked or not category_allowed:
                rules.append(MandateRuleEvaluation(
                    rule="category_policy",
                    label="Category Policy Compliance",
                    passed=False,
                    detail=f"Category '{product.category}' is prohibited under active merchant policy."
                ))
                is_declined = True
                decline_reasons.append(f"Category '{product.category}' blocked by merchant policy")
            else:
                rules.append(MandateRuleEvaluation(
                    rule="category_policy",
                    label="Category Policy Compliance",
                    passed=True,
                    detail=f"Category '{product.category}' is permitted."
                ))

        # 4. Quantity Limit
        max_allowed_qty = min(
            policy.max_quantity_per_order or 5,
            product.max_quantity_per_agent_order if product else 5
        )
        if mandate.quantity > max_allowed_qty:
            rules.append(MandateRuleEvaluation(
                rule="quantity_limit",
                label="Order Quantity Limit",
                passed=False,
                detail=f"Requested quantity ({mandate.quantity}) exceeds maximum order limit ({max_allowed_qty})."
            ))
            is_declined = True
            decline_reasons.append(f"Quantity exceeds merchant limit of {max_allowed_qty} units")
        else:
            rules.append(MandateRuleEvaluation(
                rule="quantity_limit",
                label="Order Quantity Limit",
                passed=True,
                detail=f"Quantity {mandate.quantity} within limit of {max_allowed_qty} units."
            ))

        # 5. Financial Limits: Autonomous Cap & Agent Limits
        max_trans_limit = min(
            policy.max_autonomous_transaction_limit or 50000.0,
            agent.max_transaction_limit if agent else 50000.0
        )

        if mandate.total_amount > max_trans_limit:
            rules.append(MandateRuleEvaluation(
                rule="transaction_limit",
                label="Autonomous Transaction Limit",
                passed=False,
                detail=f"Transaction total ₹{mandate.total_amount:,.2f} exceeds merchant limit of ₹{max_trans_limit:,.2f}."
            ))
            is_declined = True
            decline_reasons.append(f"Amount ₹{mandate.total_amount:,.2f} exceeds autonomous spending limit ₹{max_trans_limit:,.2f}")
            next_options.extend([
                f"Find compliant alternative under ₹{max_trans_limit:,.0f}",
                "Request human approval from cardholder",
                "Reduce purchase quantity"
            ])
            # Find compliant alternative
            if product:
                alt = db.query(Product).filter(
                    Product.category == product.category,
                    Product.id != product.id,
                    Product.agent_purchasable == True,
                    Product.price <= max_trans_limit
                ).first()
                if alt:
                    alternative_product_id = alt.id
        else:
            rules.append(MandateRuleEvaluation(
                rule="transaction_limit",
                label="Autonomous Transaction Limit",
                passed=True,
                detail=f"Amount ₹{mandate.total_amount:,.2f} is within limit of ₹{max_trans_limit:,.2f}."
            ))

        # 6. Daily Spending Limit
        if agent:
            projected_daily = (agent.spent_today or 0.0) + mandate.total_amount
            daily_limit = agent.daily_spend_limit or policy.daily_spend_limit_per_agent or 100000.0
            if projected_daily > daily_limit:
                rules.append(MandateRuleEvaluation(
                    rule="daily_spend_limit",
                    label="Agent Daily Budget Limit",
                    passed=False,
                    detail=f"Projected daily spend ₹{projected_daily:,.2f} exceeds daily cap of ₹{daily_limit:,.2f}."
                ))
                is_declined = True
                decline_reasons.append("Agent daily spending limit exceeded")
            else:
                rules.append(MandateRuleEvaluation(
                    rule="daily_spend_limit",
                    label="Agent Daily Budget Limit",
                    passed=True,
                    detail=f"Projected daily spend ₹{projected_daily:,.2f} within daily limit of ₹{daily_limit:,.2f}."
                ))

        # 7. Human Approval Threshold
        if not is_declined and product and product.requires_human_confirmation:
            requires_human = True
            rules.append(MandateRuleEvaluation(
                rule="human_approval_flag",
                label="Human Approval Flag",
                passed=False,
                detail=f"Product '{product.name}' requires explicit human sign-off per merchant configuration."
            ))

        # Determine Final Decision
        if is_declined:
            decision = "DECLINED"
            decision_reason = "; ".join(decline_reasons)
        elif requires_human:
            decision = "HUMAN_APPROVAL_REQUIRED"
            decision_reason = "Transaction exceeds autonomous threshold and requires explicit human verification."
            next_options.append("Send push approval to merchant admin")
        else:
            decision = "APPROVED"
            decision_reason = "All deterministic merchant policies, agent permissions, stock checks, and spending thresholds passed."

        # Update Mandate
        mandate.status = decision
        mandate.evaluation_result = {
            "rules": [r.model_dump() for r in rules],
            "decision": decision,
            "decision_reason": decision_reason,
            "next_options": next_options,
            "alternative_product_id": alternative_product_id
        }
        mandate.decline_reason = decision_reason if is_declined else None
        db.commit()

        # Record to Decision Ledger immediately
        ledger_entry_id = f"DEC-{uuid.uuid4().hex[:6].upper()}"
        ledger_entry = DecisionLedger(
            id=ledger_entry_id,
            mandate_id=mandate.id,
            agent_id=mandate.agent_id,
            product_id=mandate.product_id,
            product_name=product.name if product else "Unknown Product",
            quantity=mandate.quantity,
            amount=mandate.total_amount,
            currency=mandate.currency,
            buyer_prompt=mandate.buyer_prompt,
            products_evaluated_count=products_evaluated_count,
            top_candidates=top_candidates or [],
            selection_rationale=selection_rationale or [],
            trade_off=trade_off,
            rules_evaluated=[r.model_dump() for r in rules],
            decision=decision,
            decision_reason=decision_reason,
            razorpay_order_id=None,
            razorpay_payment_id=None,
            payment_status="NOT_INITIATED" if decision != "APPROVED" else "PENDING",
            razorpay_called=False
        )
        db.add(ledger_entry)
        db.commit()

        return MandateEvaluationResult(
            mandate_id=mandate.id,
            decision=decision,
            decision_reason=decision_reason,
            rules=rules,
            amount=mandate.total_amount,
            product_name=product.name if product else "Unknown",
            next_options=next_options,
            suggested_alternative_product_id=alternative_product_id
        )
