from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class SessionStatus(str, enum.Enum):
    CREATED = "created"
    STAGING = "staging"
    EXPLORING = "exploring"
    ENCOUNTER = "encounter"
    COMBAT = "combat"
    DOWNTIME = "downtime"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"

class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id"), nullable=False)
    status = Column(Enum(SessionStatus), default=SessionStatus.CREATED, nullable=False)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    settings = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    campaign = relationship("Campaign", back_populates="sessions")
    characters = relationship("Character", back_populates="session")
    npcs = relationship("NPC", back_populates="session")
    maps = relationship("Map", back_populates="session")
    encounters = relationship("Encounter", back_populates="session")
    initiative = relationship("Initiative", back_populates="session")
    turn_logs = relationship("TurnLog", back_populates="session")
    rolls = relationship("Roll", back_populates="session")
    rulings = relationship("Ruling", back_populates="session")
    loot = relationship("Loot", back_populates="session")
    journals = relationship("Journal", back_populates="session")
    exports = relationship("Export", back_populates="session")
