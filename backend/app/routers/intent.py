from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.intent import IntentParseRequest, StructuredIntent, EvaluationResponse
from app.services.intent_service import IntentService

router = APIRouter(prefix="/intent", tags=["Intent & AI Discovery"])

@router.post("/parse", response_model=StructuredIntent)
def parse_buyer_intent(req: IntentParseRequest):
    """
    Parses natural language requests into structured intent with budget & feature bounds.
    """
    return IntentService.parse_intent(req.query, max_budget_override=req.max_budget)

@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate_candidates_from_query(req: IntentParseRequest, db: Session = Depends(get_db)):
    """
    End-to-end intent parsing and transparent multi-candidate evaluation against merchant catalog.
    """
    structured_intent = IntentService.parse_intent(req.query, max_budget_override=req.max_budget)
    return IntentService.evaluate_candidates(db, structured_intent)
