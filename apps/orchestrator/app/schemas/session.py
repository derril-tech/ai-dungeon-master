from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class SessionStatus(str, Enum):
    CREATED = "created"
    STAGING = "staging"
    EXPLORING = "exploring"
    ENCOUNTER = "encounter"
    COMBAT = "combat"
    DOWNTIME = "downtime"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"

class SessionEvent(str, Enum):
    START = "start"
    PAUSE = "pause"
    RESUME = "resume"
    END = "end"
    ENCOUNTER_START = "encounter_start"
    ENCOUNTER_END = "encounter_end"
    COMBAT_START = "combat_start"
    COMBAT_END = "combat_end"
    DOWNTIME_START = "downtime_start"
    DOWNTIME_END = "downtime_end"

class SessionCreate(BaseModel):
    campaign_id: str = Field(..., description="Campaign ID")
    settings: Optional[Dict[str, Any]] = Field(default={}, description="Session settings")

class SessionResponse(BaseModel):
    id: str
    campaign_id: str
    status: SessionStatus
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    settings: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SessionStateTransition(BaseModel):
    event: SessionEvent = Field(..., description="Event to trigger state transition")
    data: Optional[Dict[str, Any]] = Field(default={}, description="Additional data for the transition")
