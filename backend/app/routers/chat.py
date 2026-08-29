from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.conversational_service import ConversationalService

router = APIRouter(prefix="/chat", tags=["Conversational Agent"])

@router.post("", response_model=ChatResponse)
def process_chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Multi-turn conversational commerce turn.
    Maintains conversational memory, discovers candidate items, and constructs purchase mandates.
    """
    return ConversationalService.process_chat_turn(db, request)
