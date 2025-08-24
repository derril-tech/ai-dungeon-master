# Created automatically by Cursor AI (2024-12-19)

import logging
from typing import Dict, List, Any, Optional
from enum import Enum
import re
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

class SafetyLevel(Enum):
    SAFE = "safe"
    WARNING = "warning"
    BLOCKED = "blocked"
    REVIEW = "review"

class ContentType(Enum):
    NARRATION = "narration"
    NPC_DIALOGUE = "npc_dialogue"
    PLAYER_INPUT = "player_input"
    COMBAT_DESCRIPTION = "combat_description"
    LOOT_DESCRIPTION = "loot_description"
    WORLD_DESCRIPTION = "world_description"

@dataclass
class SafetyResult:
    level: SafetyLevel
    flagged_content: List[str]
    reason: str
    confidence: float
    moderated_content: Optional[str] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()

class SafetyService:
    def __init__(self):
        self.sensitive_patterns = {
            'violence': [
                r'\b(kill|murder|assassinate|execute|slaughter|massacre)\b',
                r'\b(torture|mutilate|dismember|decapitate)\b',
                r'\b(rape|sexual assault|molest)\b',
                r'\b(suicide|self-harm|cutting)\b',
                r'\b(terrorism|bomb|explosive|mass shooting)\b'
            ],
            'hate_speech': [
                r'\b(nigger|faggot|kike|spic|chink|gook|towelhead)\b',
                r'\b(white supremacy|neo-nazi|kkk)\b',
                r'\b(genocide|ethnic cleansing)\b'
            ],
            'discrimination': [
                r'\b(women belong in|men are better at|all \w+ are)\b',
                r'\b(racial inferiority|racial superiority)\b',
                r'\b(religious intolerance|religious hatred)\b'
            ],
            'explicit_content': [
                r'\b(penis|vagina|dick|pussy|cock|porn|sex)\b',
                r'\b(erotic|sexual|intimate)\b'
            ]
        }
        
        self.warning_patterns = {
            'mild_violence': [
                r'\b(fight|battle|attack|defend|sword|axe|bow)\b',
                r'\b(blood|wound|injury|pain)\b',
                r'\b(death|die|dead|corpse)\b'
            ],
            'mature_themes': [
                r'\b(alcohol|drunk|intoxicated)\b',
                r'\b(drugs|addiction|withdrawal)\b',
                r'\b(gambling|betting|casino)\b'
            ]
        }

    async def moderate_content(
        self, 
        content: str, 
        content_type: ContentType,
        context: Optional[Dict[str, Any]] = None
    ) -> SafetyResult:
        """
        Moderate content using pattern matching and AI-based analysis
        """
        try:
            # Pattern-based screening
            pattern_result = self._check_patterns(content)
            
            # Context-aware analysis
            context_result = self._analyze_context(content, content_type, context)
            
            # Combine results
            final_result = self._combine_results(pattern_result, context_result)
            
            # Apply moderation if needed
            if final_result.level in [SafetyLevel.BLOCKED, SafetyLevel.WARNING]:
                final_result.moderated_content = self._apply_moderation(content, final_result)
            
            logger.info(f"Safety check completed: {final_result.level} for {content_type.value}")
            return final_result
            
        except Exception as e:
            logger.error(f"Error in content moderation: {e}")
            return SafetyResult(
                level=SafetyLevel.REVIEW,
                flagged_content=[],
                reason="Error in moderation process",
                confidence=0.0
            )

    def _check_patterns(self, content: str) -> SafetyResult:
        """Check content against sensitive and warning patterns"""
        flagged_content = []
        max_severity = SafetyLevel.SAFE
        
        # Check sensitive patterns (blocked content)
        for category, patterns in self.sensitive_patterns.items():
            for pattern in patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                if matches:
                    flagged_content.extend(matches)
                    max_severity = SafetyLevel.BLOCKED
        
        # Check warning patterns (warning content)
        if max_severity == SafetyLevel.SAFE:
            for category, patterns in self.warning_patterns.items():
                for pattern in patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    if matches:
                        flagged_content.extend(matches)
                        max_severity = SafetyLevel.WARNING
        
        return SafetyResult(
            level=max_severity,
            flagged_content=list(set(flagged_content)),
            reason=f"Pattern matching found {len(flagged_content)} flagged terms",
            confidence=0.8 if flagged_content else 1.0
        )

    def _analyze_context(
        self, 
        content: str, 
        content_type: ContentType,
        context: Optional[Dict[str, Any]] = None
    ) -> SafetyResult:
        """Analyze content in context of game setting and content type"""
        context_risk = 0.0
        context_reasons = []
        
        # Adjust risk based on content type
        content_type_risk = {
            ContentType.NARRATION: 0.1,
            ContentType.NPC_DIALOGUE: 0.2,
            ContentType.PLAYER_INPUT: 0.3,
            ContentType.COMBAT_DESCRIPTION: 0.4,
            ContentType.LOOT_DESCRIPTION: 0.1,
            ContentType.WORLD_DESCRIPTION: 0.2
        }
        
        context_risk += content_type_risk.get(content_type, 0.2)
        
        # Adjust risk based on game context
        if context:
            # Higher risk for mature-rated campaigns
            if context.get('campaign_rating') == 'mature':
                context_risk += 0.3
                context_reasons.append("Mature campaign setting")
            
            # Higher risk for certain game themes
            if context.get('theme') in ['horror', 'dark_fantasy', 'grimdark']:
                context_risk += 0.2
                context_reasons.append(f"Dark theme: {context.get('theme')}")
            
            # Lower risk for family-friendly settings
            if context.get('theme') == 'family_friendly':
                context_risk -= 0.2
                context_reasons.append("Family-friendly setting")
        
        # Determine level based on context risk
        if context_risk > 0.7:
            level = SafetyLevel.REVIEW
        elif context_risk > 0.4:
            level = SafetyLevel.WARNING
        else:
            level = SafetyLevel.SAFE
        
        return SafetyResult(
            level=level,
            flagged_content=[],
            reason=f"Context analysis: {', '.join(context_reasons) if context_reasons else 'No context concerns'}",
            confidence=0.6
        )

    def _combine_results(self, pattern_result: SafetyResult, context_result: SafetyResult) -> SafetyResult:
        """Combine pattern and context analysis results"""
        # Pattern results take precedence for blocked content
        if pattern_result.level == SafetyLevel.BLOCKED:
            return pattern_result
        
        # Use the higher severity level
        if pattern_result.level.value > context_result.level.value:
            return pattern_result
        elif context_result.level.value > pattern_result.level.value:
            return context_result
        
        # Combine flagged content
        all_flagged = list(set(pattern_result.flagged_content + context_result.flagged_content))
        
        # Average confidence
        avg_confidence = (pattern_result.confidence + context_result.confidence) / 2
        
        # Combine reasons
        combined_reason = f"Pattern: {pattern_result.reason}; Context: {context_result.reason}"
        
        return SafetyResult(
            level=pattern_result.level,
            flagged_content=all_flagged,
            reason=combined_reason,
            confidence=avg_confidence
        )

    def _apply_moderation(self, content: str, result: SafetyResult) -> str:
        """Apply moderation to content based on safety result"""
        if result.level == SafetyLevel.BLOCKED:
            return "[Content blocked for safety reasons]"
        
        elif result.level == SafetyLevel.WARNING:
            # Replace sensitive terms with alternatives
            moderated = content
            replacements = {
                'kill': 'defeat',
                'murder': 'eliminate',
                'blood': 'red liquid',
                'corpse': 'fallen foe',
                'death': 'defeat',
                'die': 'fall'
            }
            
            for term, replacement in replacements.items():
                moderated = re.sub(rf'\b{term}\b', replacement, moderated, flags=re.IGNORECASE)
            
            return moderated
        
        return content

    async def get_safety_report(self, session_id: str) -> Dict[str, Any]:
        """Generate a safety report for a session"""
        # This would typically query the database for session content
        # and generate a comprehensive safety report
        return {
            'session_id': session_id,
            'total_checks': 0,
            'blocked_content': 0,
            'warnings': 0,
            'flagged_terms': [],
            'safety_score': 1.0,
            'recommendations': []
        }

    def update_safety_rules(self, new_patterns: Dict[str, List[str]]):
        """Update safety patterns (admin function)"""
        for category, patterns in new_patterns.items():
            if category in self.sensitive_patterns:
                self.sensitive_patterns[category].extend(patterns)
            elif category in self.warning_patterns:
                self.warning_patterns[category].extend(patterns)
            else:
                # Add new category
                self.sensitive_patterns[category] = patterns

# Global safety service instance
safety_service = SafetyService()
