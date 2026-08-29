import uuid
import time
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models import Mandate, DecisionLedger, Product, Agent

class RazorpayAdapter:
    @staticmethod
    def create_order(
        db: Session,
        mandate_id: str,
        simulate_failure: bool = False
    ) -> Dict[str, Any]:
        """
        Creates a Razorpay order ONLY IF the mandate was authorized (APPROVED).
        If the mandate is DECLINED, Razorpay is NEVER called.
        """
        mandate = db.query(Mandate).filter(Mandate.id == mandate_id).first()
        if not mandate:
            raise ValueError(f"Mandate {mandate_id} not found")

        if mandate.status != "APPROVED":
            raise ValueError(
                f"Cannot initiate Razorpay payment. Mandate status is '{mandate.status}'. "
                "Razorpay is only invoked for APPROVED transactions."
            )

        ledger_entry = db.query(DecisionLedger).filter(DecisionLedger.mandate_id == mandate_id).first()

        # Amount in paise (1 INR = 100 paise)
        amount_in_paise = int(round(mandate.total_amount * 100))
        receipt_id = f"rcpt_{uuid.uuid4().hex[:10]}"
        
        order_id = f"order_{uuid.uuid4().hex[:14]}"
        
        # Try real razorpay client if valid keys are configured and not mock
        using_live_test_api = False
        if settings.RAZORPAY_KEY_ID.startswith("rzp_test_") and not settings.RAZORPAY_KEY_ID.startswith("rzp_test_mock"):
            try:
                import razorpay
                client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
                order_data = {
                    "amount": amount_in_paise,
                    "currency": mandate.currency or "INR",
                    "receipt": receipt_id,
                    "notes": {
                        "agent_id": mandate.agent_id,
                        "mandate_id": mandate.id,
                        "product_id": mandate.product_id
                    }
                }
                real_order = client.order.create(data=order_data)
                order_id = real_order.get("id", order_id)
                using_live_test_api = True
            except Exception as e:
                print(f"[RazorpayAdapter] Live API call failed, falling back to Sandbox Simulator: {e}")

        # Update Decision Ledger that Razorpay was called
        if ledger_entry:
            ledger_entry.razorpay_called = True
            ledger_entry.razorpay_order_id = order_id
            ledger_entry.payment_status = "ORDER_CREATED"
            db.commit()

        return {
            "order_id": order_id,
            "amount": mandate.total_amount,
            "amount_paise": amount_in_paise,
            "currency": mandate.currency or "INR",
            "receipt": receipt_id,
            "key_id": settings.RAZORPAY_KEY_ID,
            "live_mode": using_live_test_api,
            "status": "created"
        }

    @staticmethod
    def complete_payment(
        db: Session,
        mandate_id: str,
        razorpay_order_id: str,
        razorpay_payment_id: Optional[str] = None,
        simulate_failure: bool = False
    ) -> Dict[str, Any]:
        """
        Finalizes the payment, decrements product inventory, updates agent spent today,
        and records the final transaction outcome in the Decision Ledger.
        """
        mandate = db.query(Mandate).filter(Mandate.id == mandate_id).first()
        if not mandate:
            raise ValueError(f"Mandate {mandate_id} not found")

        ledger_entry = db.query(DecisionLedger).filter(DecisionLedger.mandate_id == mandate_id).first()
        product = db.query(Product).filter(Product.id == mandate.product_id).first()
        agent = db.query(Agent).filter(Agent.id == mandate.agent_id).first()

        payment_id = razorpay_payment_id or f"pay_{uuid.uuid4().hex[:14]}"

        if simulate_failure:
            # Record graceful payment failure
            if ledger_entry:
                ledger_entry.razorpay_called = True
                ledger_entry.razorpay_order_id = razorpay_order_id
                ledger_entry.razorpay_payment_id = payment_id
                ledger_entry.payment_status = "FAILED"
                ledger_entry.decision_reason += " | Payment execution failed (card network declined)."
                db.commit()

            return {
                "success": False,
                "mandate_id": mandate.id,
                "order_id": razorpay_order_id,
                "payment_id": payment_id,
                "status": "FAILED",
                "message": "Payment was declined by payment network. No duplicate payment will be attempted."
            }

        # Payment Success Flow
        if product:
            product.stock = max(0, product.stock - mandate.quantity)
        
        if agent:
            agent.spent_today = (agent.spent_today or 0.0) + mandate.total_amount

        if ledger_entry:
            ledger_entry.razorpay_called = True
            ledger_entry.razorpay_order_id = razorpay_order_id
            ledger_entry.razorpay_payment_id = payment_id
            ledger_entry.payment_status = "SUCCESS"
            db.commit()

        return {
            "success": True,
            "mandate_id": mandate.id,
            "order_id": razorpay_order_id,
            "payment_id": payment_id,
            "amount": mandate.total_amount,
            "currency": mandate.currency,
            "status": "SUCCESS",
            "decision_ledger_id": ledger_entry.id if ledger_entry else None,
            "message": "Razorpay payment captured successfully."
        }
