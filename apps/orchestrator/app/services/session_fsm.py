from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime
import structlog
from crewai import Crew, Agent, Task
from app.models.session import Session, SessionStatus
from app.core.config import settings

logger = structlog.get_logger()

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

class SessionFSM:
    """Finite State Machine for managing session flow"""
    
    def __init__(self, session: Session):
        self.session = session
        self.crew = None
        self.setup_agents()
    
    def setup_agents(self):
        """Initialize CrewAI agents for the session"""
        # Dungeon Master Agent
        self.dm_agent = Agent(
            role="Dungeon Master",
            goal="Create engaging, immersive tabletop RPG experiences",
            backstory="""You are an experienced Dungeon Master who excels at creating 
            dynamic, engaging campaigns. You adapt to player choices, maintain pacing, 
            and ensure everyone has fun while following the rules.""",
            verbose=True,
            allow_delegation=True,
            tools=[]  # Will be populated with specific tools
        )
        
        # NPC Actor Agent
        self.npc_agent = Agent(
            role="NPC Actor",
            goal="Bring NPCs to life with distinct personalities and motivations",
            backstory="""You are a skilled actor who can embody any character with 
            unique voice, mannerisms, and motivations. You maintain character consistency 
            and react authentically to player interactions.""",
            verbose=True,
            allow_delegation=True,
            tools=[]
        )
        
        # Rules Lawyer Agent
        self.rules_agent = Agent(
            role="Rules Lawyer",
            goal="Ensure fair and consistent application of game rules",
            backstory="""You are a rules expert who knows the game system inside and out. 
            You provide clear rulings, explain mechanics, and ensure the game runs smoothly 
            according to the established rules.""",
            verbose=True,
            allow_delegation=True,
            tools=[]
        )
        
        # Combat Resolver Agent
        self.combat_agent = Agent(
            role="Combat Resolver",
            goal="Manage tactical combat encounters efficiently and fairly",
            backstory="""You are a tactical combat specialist who manages initiative, 
            resolves actions, and ensures combat flows smoothly while maintaining 
            strategic depth and fairness.""",
            verbose=True,
            allow_delegation=True,
            tools=[]
        )
        
        # Safety Moderator Agent
        self.safety_agent = Agent(
            role="Safety Moderator",
            goal="Ensure all content is appropriate and safe for all players",
            backstory="""You are a content safety specialist who monitors all game 
            content for appropriateness, enforces safety tools, and ensures the 
            gaming environment is welcoming for all participants.""",
            verbose=True,
            allow_delegation=True,
            tools=[]
        )
        
        # Session Scribe Agent
        self.scribe_agent = Agent(
            role="Session Scribe",
            goal="Document the session for future reference and continuity",
            backstory="""You are a meticulous record keeper who documents all important 
            events, decisions, and outcomes from the session. You create clear, 
            organized records that help maintain campaign continuity.""",
            verbose=True,
            allow_delegation=True,
            tools=[]
        )
    
    def create_crew(self) -> Crew:
        """Create the CrewAI crew for the session"""
        self.crew = Crew(
            agents=[
                self.dm_agent,
                self.npc_agent,
                self.rules_agent,
                self.combat_agent,
                self.safety_agent,
                self.scribe_agent
            ],
            tasks=[],
            verbose=True,
            memory=True
        )
        return self.crew
    
    def transition(self, event: SessionEvent, **kwargs) -> Dict[str, Any]:
        """Handle state transitions based on events"""
        current_status = self.session.status
        logger.info("Session state transition", 
                   session_id=str(self.session.id),
                   current_status=current_status,
                   event=event)
        
        if event == SessionEvent.START:
            if current_status == SessionStatus.CREATED:
                return self._handle_start()
            elif current_status == SessionStatus.PAUSED:
                return self._handle_resume()
        
        elif event == SessionEvent.PAUSE:
            if current_status in [SessionStatus.EXPLORING, SessionStatus.ENCOUNTER, SessionStatus.COMBAT]:
                return self._handle_pause()
        
        elif event == SessionEvent.ENCOUNTER_START:
            if current_status == SessionStatus.EXPLORING:
                return self._handle_encounter_start(**kwargs)
        
        elif event == SessionEvent.COMBAT_START:
            if current_status == SessionStatus.ENCOUNTER:
                return self._handle_combat_start(**kwargs)
        
        elif event == SessionEvent.COMBAT_END:
            if current_status == SessionStatus.COMBAT:
                return self._handle_combat_end(**kwargs)
        
        elif event == SessionEvent.END:
            if current_status not in [SessionStatus.COMPLETED, SessionStatus.FAILED]:
                return self._handle_end()
        
        logger.warning("Invalid state transition", 
                      session_id=str(self.session.id),
                      current_status=current_status,
                      event=event)
        return {"error": "Invalid state transition"}
    
    def _handle_start(self) -> Dict[str, Any]:
        """Handle session start transition"""
        self.session.status = SessionStatus.STAGING
        self.session.started_at = datetime.utcnow()
        self.session.updated_at = datetime.utcnow()
        
        # Initialize CrewAI crew
        crew = self.create_crew()
        
        logger.info("Session started", session_id=str(self.session.id))
        return {
            "status": "success",
            "new_status": SessionStatus.STAGING,
            "message": "Session started successfully"
        }
    
    def _handle_resume(self) -> Dict[str, Any]:
        """Handle session resume transition"""
        self.session.status = SessionStatus.EXPLORING
        self.session.updated_at = datetime.utcnow()
        
        logger.info("Session resumed", session_id=str(self.session.id))
        return {
            "status": "success",
            "new_status": SessionStatus.EXPLORING,
            "message": "Session resumed successfully"
        }
    
    def _handle_pause(self) -> Dict[str, Any]:
        """Handle session pause transition"""
        self.session.status = SessionStatus.PAUSED
        self.session.updated_at = datetime.utcnow()
        
        logger.info("Session paused", session_id=str(self.session.id))
        return {
            "status": "success",
            "new_status": SessionStatus.PAUSED,
            "message": "Session paused successfully"
        }
    
    def _handle_encounter_start(self, **kwargs) -> Dict[str, Any]:
        """Handle encounter start transition"""
        self.session.status = SessionStatus.ENCOUNTER
        self.session.updated_at = datetime.utcnow()
        
        # Create encounter task for CrewAI
        encounter_task = Task(
            description=f"Start encounter: {kwargs.get('description', 'Unknown encounter')}",
            agent=self.dm_agent,
            expected_output="Encounter setup and initial narration"
        )
        
        logger.info("Encounter started", 
                   session_id=str(self.session.id),
                   encounter_data=kwargs)
        return {
            "status": "success",
            "new_status": SessionStatus.ENCOUNTER,
            "message": "Encounter started successfully",
            "task": encounter_task
        }
    
    def _handle_combat_start(self, **kwargs) -> Dict[str, Any]:
        """Handle combat start transition"""
        self.session.status = SessionStatus.COMBAT
        self.session.updated_at = datetime.utcnow()
        
        # Create combat task for CrewAI
        combat_task = Task(
            description=f"Start combat: {kwargs.get('description', 'Combat encounter')}",
            agent=self.combat_agent,
            expected_output="Combat setup and initiative order"
        )
        
        logger.info("Combat started", 
                   session_id=str(self.session.id),
                   combat_data=kwargs)
        return {
            "status": "success",
            "new_status": SessionStatus.COMBAT,
            "message": "Combat started successfully",
            "task": combat_task
        }
    
    def _handle_combat_end(self, **kwargs) -> Dict[str, Any]:
        """Handle combat end transition"""
        self.session.status = SessionStatus.EXPLORING
        self.session.updated_at = datetime.utcnow()
        
        logger.info("Combat ended", 
                   session_id=str(self.session.id),
                   combat_result=kwargs)
        return {
            "status": "success",
            "new_status": SessionStatus.EXPLORING,
            "message": "Combat ended successfully"
        }
    
    def _handle_end(self) -> Dict[str, Any]:
        """Handle session end transition"""
        self.session.status = SessionStatus.COMPLETED
        self.session.ended_at = datetime.utcnow()
        self.session.updated_at = datetime.utcnow()
        
        # Create session wrap-up task
        wrapup_task = Task(
            description="Wrap up the session and create summary",
            agent=self.scribe_agent,
            expected_output="Session summary and next session hooks"
        )
        
        logger.info("Session ended", session_id=str(self.session.id))
        return {
            "status": "success",
            "new_status": SessionStatus.COMPLETED,
            "message": "Session ended successfully",
            "task": wrapup_task
        }
    
    def get_available_events(self) -> list[SessionEvent]:
        """Get list of available events for current state"""
        current_status = self.session.status
        
        if current_status == SessionStatus.CREATED:
            return [SessionEvent.START]
        elif current_status == SessionStatus.STAGING:
            return [SessionEvent.ENCOUNTER_START, SessionEvent.PAUSE]
        elif current_status == SessionStatus.EXPLORING:
            return [SessionEvent.ENCOUNTER_START, SessionEvent.PAUSE, SessionEvent.END]
        elif current_status == SessionStatus.ENCOUNTER:
            return [SessionEvent.COMBAT_START, SessionEvent.ENCOUNTER_END, SessionEvent.PAUSE]
        elif current_status == SessionStatus.COMBAT:
            return [SessionEvent.COMBAT_END, SessionEvent.PAUSE]
        elif current_status == SessionStatus.PAUSED:
            return [SessionEvent.RESUME, SessionEvent.END]
        else:
            return []
