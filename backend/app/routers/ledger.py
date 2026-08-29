from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.ledger_service import LedgerService
from app.services.passport_service import PassportService
from app.schemas.ledger import DecisionLedgerResponse, LedgerSummaryStats
from app.schemas.passport import PurchasePassportResponse

router = APIRouter(tags=["Decision Ledger & Passport"])

@router.get("/ledger", response_model=List[DecisionLedgerResponse])
def list_decisions(
    agent_id: Optional[str] = None,
    decision: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Returns the immutable audit trail of all purchase authorization decisions (Approved, Declined, Human Approval).
    """
    return LedgerService.get_entries(db, agent_id=agent_id, decision=decision, limit=limit, offset=offset)

@router.get("/ledger/stats", response_model=LedgerSummaryStats)
def get_ledger_stats(db: Session = Depends(get_db)):
    """
    Returns aggregate metrics for merchant dashboard.
    """
    return LedgerService.get_summary_stats(db)

@router.get("/ledger/{entry_id}", response_model=DecisionLedgerResponse)
def get_decision_detail(entry_id: str, db: Session = Depends(get_db)):
    entry = LedgerService.get_entry_by_id(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Decision ledger record not found")
    return entry

@router.get("/passport/{transaction_id}", response_model=PurchasePassportResponse)
def get_purchase_passport(transaction_id: str, db: Session = Depends(get_db)):
    """
    Generates a grounded, transparent Purchase Passport explaining what the AI evaluated,
    why it selected the product, how it was authorized, and payment verification.
    """
    passport = PassportService.generate_passport(db, transaction_id)
    if not passport:
        raise HTTPException(status_code=404, detail="Transaction not found for Purchase Passport")
    return passport
