from typing import Dict, Any, AsyncGenerator
import structlog
from crewai import Task
from app.services.session_fsm import SessionFSM
from app.models.session import Session
from app.core.config import settings
from app.services.safety_service import safety_service, ContentType
import asyncio

logger = structlog.get_logger()

class NarrationService:
    """Service for generating AI Dungeon Master narration"""
    
    def __init__(self, session: Session, fsm: SessionFSM):
        self.session = session
        self.fsm = fsm
        self.dm_agent = fsm.dm_agent
    
    async def narrate_scene(self, context: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """Generate streaming narration for the current scene"""
        logger.info("Starting scene narration", 
                   session_id=str(self.session.id),
                   context=context)
        
        # Create narration task
        narration_task = Task(
            description=f"""Narrate the current scene based on the context:
            Campaign: {self.session.campaign.name if self.session.campaign else 'Unknown'}
            Session Status: {self.session.status}
            Context: {context}
            
            Provide engaging, descriptive narration that sets the scene and 
            invites player interaction. Use the campaign's tone and style.
            """,
            agent=self.dm_agent,
            expected_output="Engaging scene narration"
        )
        
        # Execute task with streaming
        try:
            result = await self._execute_task_streaming(narration_task)
            async for chunk in result:
                yield chunk
        except Exception as e:
            logger.error("Narration generation failed", 
                        session_id=str(self.session.id),
                        error=str(e))
            yield "The scene fades to black as something goes wrong..."
    
    async def narrate_action(self, action: str, context: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """Generate narration for a specific action"""
        logger.info("Narrating action", 
                   session_id=str(self.session.id),
                   action=action)
        
        action_task = Task(
            description=f"""Narrate the following action:
            Action: {action}
            Context: {context}
            
            Describe the immediate consequences and visual/auditory details
            of this action. Keep it concise but vivid.
            """,
            agent=self.dm_agent,
            expected_output="Action narration"
        )
        
        try:
            result = await self._execute_task_streaming(action_task)
            async for chunk in result:
                yield chunk
        except Exception as e:
            logger.error("Action narration failed", 
                        session_id=str(self.session.id),
                        error=str(e))
            yield "The action's outcome is unclear..."
    
    async def narrate_transition(self, from_state: str, to_state: str, context: Dict[str, Any]) -> AsyncGenerator[str, None]:
        """Generate narration for state transitions"""
        logger.info("Narrating transition", 
                   session_id=str(self.session.id),
                   from_state=from_state,
                   to_state=to_state)
        
        transition_task = Task(
            description=f"""Narrate the transition from {from_state} to {to_state}:
            Context: {context}
            
            Provide smooth, atmospheric narration that bridges the two states
            and maintains immersion.
            """,
            agent=self.dm_agent,
            expected_output="Transition narration"
        )
        
        try:
            result = await self._execute_task_streaming(transition_task)
            async for chunk in result:
                yield chunk
        except Exception as e:
            logger.error("Transition narration failed", 
                        session_id=str(self.session.id),
                        error=str(e))
            yield "The scene shifts..."
    
    async def _execute_task_streaming(self, task: Task) -> AsyncGenerator[str, None]:
        """Execute a CrewAI task with streaming output"""
        # This is a simplified implementation
        # In a real implementation, you'd integrate with the actual CrewAI streaming
        try:
            # Simulate streaming response
            response = await self._simulate_crewai_response(task)
            
            # Apply safety moderation
            safety_result = await safety_service.moderate_content(
                response,
                ContentType.NARRATION,
                context={
                    'campaign_rating': getattr(self.session.campaign, 'rating', 'general'),
                    'theme': getattr(self.session.campaign, 'theme', 'fantasy')
                }
            )
            
            # Use moderated content if available
            content_to_stream = safety_result.moderated_content or response
            
            # Log safety check results
            if safety_result.level.value != 'safe':
                logger.warning("Safety check flagged content",
                             session_id=str(self.session.id),
                             level=safety_result.level.value,
                             reason=safety_result.reason,
                             flagged_content=safety_result.flagged_content)
            
            words = content_to_stream.split()
            
            for i, word in enumerate(words):
                yield word + " "
                if i % 5 == 0:  # Yield every 5 words for realistic streaming
                    await asyncio.sleep(0.1)
                    
        except Exception as e:
            logger.error("Task execution failed", error=str(e))
            yield "The narration falters..."
    
    async def _simulate_crewai_response(self, task: Task) -> str:
        """Simulate CrewAI response for development"""
        # This would be replaced with actual CrewAI integration
        if "scene" in task.description.lower():
            return "The ancient stone walls of the dungeon loom before you, their weathered surfaces telling tales of forgotten ages. Torchlight flickers against the rough-hewn stone, casting dancing shadows that seem to move with a life of their own. The air is thick with the scent of damp earth and something else—something that speaks of danger and adventure waiting just beyond the next turn."
        elif "action" in task.description.lower():
            return "The action unfolds with dramatic flair, the consequences rippling through the scene like waves in a still pond."
        else:
            return "The scene transitions smoothly, maintaining the atmosphere and drawing you deeper into the adventure."
