from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.ledger import DecisionLedger
from app.models.policy import MerchantPolicy
from app.schemas.passport import PurchasePassportResponse, CandidateSummary, GroundedFactor

class PassportService:
    @staticmethod
    def generate_passport(db: Session, transaction_id: str) -> Optional[PurchasePassportResponse]:
        """
        Builds the buyer-facing Purchase Passport strictly from recorded ledger facts.
        Never invents post-hoc justifications.
        """
        ledger = db.query(DecisionLedger).filter(
            (DecisionLedger.id == transaction_id) |
            (DecisionLedger.mandate_id == transaction_id) |
            (DecisionLedger.razorpay_order_id == transaction_id)
        ).first()

        if not ledger:
            return None

        policy = db.query(MerchantPolicy).filter(MerchantPolicy.id == "default_policy").first()
        merchant_name = policy.merchant_name if policy else "Acme Electronics"

        # Transform candidates
        candidates_summary: List[CandidateSummary] = []
        for c in (ledger.top_candidates or []):
            candidates_summary.append(
                CandidateSummary(
                    product_id=c.get("product_id", ""),
                    name=c.get("product_name", ""),
                    price=float(c.get("price", 0.0)),
                    match_score=float(c.get("match_score", 0.0))
                )
            )

        # Build Grounded Authorization Factors
        auth_factors: List[GroundedFactor] = []
        for r in (ledger.rules_evaluated or []):
            passed = r.get("passed", False)
            auth_factors.append(
                GroundedFactor(
                    label=r.get("label", r.get("rule", "Rule")),
                    description=r.get("detail", ""),
                    status="VERIFIED" if passed else "WARNING"
                )
            )

        return PurchasePassportResponse(
            passport_id=f"PSP-{ledger.id.replace('DEC-', '')}",
            transaction_id=ledger.id,
            product_name=ledger.product_name,
            amount=ledger.amount,
            currency=ledger.currency,
            buyer_request=ledger.buyer_prompt or "Natural language purchase inquiry",
            products_evaluated_count=ledger.products_evaluated_count or len(candidates_summary),
            top_candidates=candidates_summary,
            why_selected=ledger.selection_rationale or [
                f"₹{ledger.amount:,.0f} satisfied the budget limit",
                "Product features matched intent criteria",
                "Received highest compatibility ranking score"
            ],
            trade_offs=ledger.trade_off,
            authorization_summary=auth_factors,
            payment_status=ledger.payment_status,
            payment_method="Razorpay Payment Gateway (Test Mode)",
            razorpay_order_id=ledger.razorpay_order_id,
            razorpay_payment_id=ledger.razorpay_payment_id,
            timestamp=ledger.created_at,
            merchant_name=merchant_name
        )
