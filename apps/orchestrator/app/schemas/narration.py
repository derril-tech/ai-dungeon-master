from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class NarrationRequest(BaseModel):
    context: Dict[str, Any] = Field(default={}, description="Context for narration")
    style: Optional[str] = Field(default="default", description="Narration style")
    length: Optional[str] = Field(default="medium", description="Desired length (short/medium/long)")

class NPCResponseRequest(BaseModel):
    action: str = Field(..., description="Player action that triggered the response")
    context: Dict[str, Any] = Field(default={}, description="Context for the response")
    npc_id: Optional[str] = Field(default=None, description="Specific NPC to respond")
    tone: Optional[str] = Field(default="neutral", description="Response tone")

class NarrationChunk(BaseModel):
    type: str = Field(..., description="Type of narration chunk")
    content: str = Field(..., description="Narration content")
    timestamp: Optional[str] = Field(default=None, description="Timestamp of the chunk")
