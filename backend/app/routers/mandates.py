from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Mandate
from app.schemas.mandate import MandateCreateRequest, MandateResponse, MandateEvaluationResult
from app.services.mandate_engine import MandateEngine

router = APIRouter(prefix="/mandates", tags=["Mandates & Policy Engine"])

@router.post("", response_model=MandateEvaluationResult)
def create_and_evaluate_mandate(req: MandateCreateRequest, db: Session = Depends(get_db)):
    """
    Creates a purchase mandate from intent and immediately evaluates it
    against deterministic merchant policies, recording to the decision ledger.
    """
    try:
        mandate = MandateEngine.create_mandate(db, req)
        result = MandateEngine.evaluate_mandate(
            db,
            mandate=mandate,
            top_candidates=req.top_candidates,
            selection_rationale=req.selection_rationale,
            trade_off=req.trade_off,
            products_evaluated_count=req.products_evaluated_count
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{mandate_id}", response_model=MandateResponse)
def get_mandate(mandate_id: str, db: Session = Depends(get_db)):
    mandate = db.query(Mandate).filter(Mandate.id == mandate_id).first()
    if not mandate:
        raise HTTPException(status_code=404, detail="Mandate not found")
    return mandate
