from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.services.session_fsm import SessionFSM, SessionEvent
from app.models.session import Session as SessionModel
from app.schemas.session import SessionCreate, SessionResponse, SessionStateTransition

router = APIRouter()

@router.post("/", response_model=SessionResponse)
def create_session(session_data: SessionCreate, db: Session = Depends(get_db)):
    """Create a new session"""
    # Implementation for creating session
    pass

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    """Get session by ID"""
    # Implementation for getting session
    pass

@router.post("/{session_id}/transition")
def transition_session_state(
    session_id: str, 
    transition: SessionStateTransition, 
    db: Session = Depends(get_db)
):
    """Transition session to a new state"""
    # Get session from database
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Create FSM instance
    fsm = SessionFSM(session)
    
    # Perform transition
    result = fsm.transition(transition.event, **transition.data)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Save session state
    db.commit()
    
    return result

@router.get("/{session_id}/available-events")
def get_available_events(session_id: str, db: Session = Depends(get_db)):
    """Get available events for current session state"""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    fsm = SessionFSM(session)
    return {"available_events": fsm.get_available_events()}
