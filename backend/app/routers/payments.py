from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.razorpay_adapter import RazorpayAdapter

router = APIRouter(prefix="/payments", tags=["Razorpay Execution Layer"])

class CreateOrderRequest(BaseModel):
    mandate_id: str

class CompletePaymentRequest(BaseModel):
    mandate_id: str
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    simulate_failure: bool = False

@router.post("/create-order")
def create_razorpay_order(req: CreateOrderRequest, db: Session = Depends(get_db)):
    """
    Creates a Razorpay payment order ONLY IF the mandate is already APPROVED by the policy engine.
    """
    try:
        return RazorpayAdapter.create_order(db, mandate_id=req.mandate_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/complete")
def complete_payment(req: CompletePaymentRequest, db: Session = Depends(get_db)):
    """
    Finalizes the Razorpay transaction, records status in Decision Ledger, and decrements stock.
    """
    try:
        return RazorpayAdapter.complete_payment(
            db,
            mandate_id=req.mandate_id,
            razorpay_order_id=req.razorpay_order_id,
            razorpay_payment_id=req.razorpay_payment_id,
            simulate_failure=req.simulate_failure
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
