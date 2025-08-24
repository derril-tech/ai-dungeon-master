from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
from app.core.database import get_db
from app.models.session import Session as SessionModel
from app.services.session_fsm import SessionFSM
from app.services.narration_service import NarrationService
from app.schemas.narration import NarrationRequest, NPCResponseRequest

router = APIRouter()

@router.post("/{session_id}/narrate")
async def narrate_scene(
    session_id: str, 
    request: NarrationRequest,
    db: Session = Depends(get_db)
):
    """Generate streaming narration for the current scene"""
    # Get session
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Create FSM and narration service
    fsm = SessionFSM(session)
    narration_service = NarrationService(session, fsm)
    
    async def generate_narration():
        async for chunk in narration_service.narrate_scene(request.context):
            yield f"data: {json.dumps({'type': 'narration', 'content': chunk})}\n\n"
    
    return StreamingResponse(
        generate_narration(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@router.post("/{session_id}/npc-response")
async def get_npc_response(
    session_id: str,
    request: NPCResponseRequest,
    db: Session = Depends(get_db)
):
    """Get NPC response to player actions"""
    # Get session
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Create FSM and narration service
    fsm = SessionFSM(session)
    narration_service = NarrationService(session, fsm)
    
    async def generate_response():
        async for chunk in narration_service.narrate_action(request.action, request.context):
            yield f"data: {json.dumps({'type': 'npc_response', 'content': chunk})}\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
