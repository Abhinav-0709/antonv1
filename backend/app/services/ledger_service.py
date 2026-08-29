from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ledger import DecisionLedger
from app.models.agent import Agent
from app.schemas.ledger import LedgerSummaryStats

class LedgerService:
    @staticmethod
    def get_entries(
        db: Session,
        agent_id: Optional[str] = None,
        decision: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[DecisionLedger]:
        query = db.query(DecisionLedger)
        if agent_id:
            query = query.filter(DecisionLedger.agent_id == agent_id)
        if decision:
            query = query.filter(DecisionLedger.decision == decision.upper())
        
        return query.order_by(DecisionLedger.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def get_entry_by_id(db: Session, entry_id: str) -> Optional[DecisionLedger]:
        return db.query(DecisionLedger).filter(
            (DecisionLedger.id == entry_id) | (DecisionLedger.mandate_id == entry_id)
        ).first()

    @staticmethod
    def get_summary_stats(db: Session) -> LedgerSummaryStats:
        total = db.query(DecisionLedger).count()
        approved = db.query(DecisionLedger).filter(DecisionLedger.decision == "APPROVED").count()
        declined = db.query(DecisionLedger).filter(DecisionLedger.decision == "DECLINED").count()
        human_app = db.query(DecisionLedger).filter(DecisionLedger.decision == "HUMAN_APPROVAL_REQUIRED").count()
        
        # Calculate transacted volume for successful payments
        vol_result = db.query(func.sum(DecisionLedger.amount)).filter(
            DecisionLedger.decision == "APPROVED",
            DecisionLedger.payment_status == "SUCCESS"
        ).scalar()
        transacted_vol = float(vol_result or 0.0)

        active_agents = db.query(Agent).filter(Agent.status == "ACTIVE").count()

        return LedgerSummaryStats(
            total_decisions=total,
            approved_count=approved,
            declined_count=declined,
            human_approval_count=human_app,
            total_transacted_volume=transacted_vol,
            active_agents_count=active_agents
        )
