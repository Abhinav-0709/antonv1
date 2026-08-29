from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Agent
from app.schemas.agent import AgentResponse, AgentCreate, AgentUpdate, AgentRevokeRequest

router = APIRouter(prefix="/agents", tags=["Agent Management & Access"])

@router.get("", response_model=List[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    return db.query(Agent).all()

@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.post("", response_model=AgentResponse)
def create_agent(agent_in: AgentCreate, db: Session = Depends(get_db)):
    existing = db.query(Agent).filter(Agent.id == agent_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Agent ID '{agent_in.id}' already exists")
    agent = Agent(**agent_in.model_dump())
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent

@router.post("/{agent_id}/revoke", response_model=AgentResponse)
def revoke_agent_access(agent_id: str, req: AgentRevokeRequest, db: Session = Depends(get_db)):
    """
    Revokes an AI buyer agent's purchasing permissions in real-time.
    All future mandates submitted by this agent will be rejected by the Mandate Engine.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.status = "REVOKED"
    agent.revoked_at = datetime.now(timezone.utc)
    agent.revocation_reason = req.reason
    db.commit()
    db.refresh(agent)
    return agent

@router.post("/{agent_id}/restore", response_model=AgentResponse)
def restore_agent_access(agent_id: str, db: Session = Depends(get_db)):
    """
    Restores revoked AI agent status to ACTIVE.
    """
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent.status = "ACTIVE"
    agent.revoked_at = None
    agent.revocation_reason = None
    db.commit()
    db.refresh(agent)
    return agent
