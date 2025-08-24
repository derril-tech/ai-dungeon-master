from fastapi import APIRouter
from .endpoints import sessions, campaigns, narration, combat

api_router = APIRouter()

api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(narration.router, prefix="/narration", tags=["narration"])
api_router.include_router(combat.router, prefix="/combat", tags=["combat"])
