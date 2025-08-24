from celery import shared_task
import re
import random
import structlog
from typing import Dict, Any, List, Tuple

logger = structlog.get_logger()

@shared_task
def roll_dice(expression: str, advantage: str = "normal") -> Dict[str, Any]:
    """
    Parse and execute dice expressions like "2d20kh1 + 5" or "1d6"
    
    Args:
        expression: Dice expression string
        advantage: "normal", "advantage", or "disadvantage"
    
    Returns:
        Dict with roll results
    """
    try:
        logger.info("Rolling dice", expression=expression, advantage=advantage)
        
        # Parse the expression
        parsed = parse_dice_expression(expression)
        if not parsed:
            return {"error": "Invalid dice expression"}
        
        # Roll the dice
        rolls = []
        for dice_type, count in parsed.items():
            for _ in range(count):
                roll = random.randint(1, dice_type)
                rolls.append(roll)
        
        # Handle advantage/disadvantage for d20 rolls
        if advantage != "normal" and 20 in parsed:
            d20_rolls = [r for r in rolls if r <= 20]
            if len(d20_rolls) >= 2:
                if advantage == "advantage":
                    rolls = [max(d20_rolls[:2])] + [r for r in rolls if r > 20]
                elif advantage == "disadvantage":
                    rolls = [min(d20_rolls[:2])] + [r for r in rolls if r > 20]
        
        # Calculate total
        total = sum(rolls)
        
        # Handle keep highest/lowest (kh/kl)
        if "kh" in expression or "kl" in expression:
            keep_match = re.search(r'k([hl])(\d+)', expression)
            if keep_match:
                keep_type, keep_count = keep_match.groups()
                keep_count = int(keep_count)
                
                if keep_type == "h":
                    rolls = sorted(rolls, reverse=True)[:keep_count]
                else:  # keep lowest
                    rolls = sorted(rolls)[:keep_count]
                
                total = sum(rolls)
        
        result = {
            "expression": expression,
            "advantage": advantage,
            "rolls": rolls,
            "total": total,
            "raw_expression": expression
        }
        
        logger.info("Dice roll completed", result=result)
        return result
        
    except Exception as e:
        logger.error("Dice roll failed", expression=expression, error=str(e))
        return {"error": f"Dice roll failed: {str(e)}"}

@shared_task
def resolve_check(
    expression: str, 
    dc: int, 
    advantage: str = "normal",
    modifiers: Dict[str, int] = None
) -> Dict[str, Any]:
    """
    Resolve a skill check or saving throw
    
    Args:
        expression: Dice expression (usually "1d20 + modifier")
        dc: Difficulty class
        advantage: "normal", "advantage", or "disadvantage"
        modifiers: Additional modifiers to apply
    
    Returns:
        Dict with check results
    """
    try:
        logger.info("Resolving check", expression=expression, dc=dc, advantage=advantage)
        
        # Roll the dice
        roll_result = roll_dice(expression, advantage)
        if "error" in roll_result:
            return roll_result
        
        total = roll_result["total"]
        
        # Apply modifiers
        if modifiers:
            for modifier_name, modifier_value in modifiers.items():
                total += modifier_value
                roll_result["modifiers"] = modifiers
                roll_result["total"] = total
        
        # Determine success
        success = total >= dc
        margin = total - dc
        
        # Determine degree of success/failure
        if total >= dc + 10:
            degree = "critical_success"
        elif total <= dc - 10:
            degree = "critical_failure"
        elif success:
            degree = "success"
        else:
            degree = "failure"
        
        result = {
            **roll_result,
            "dc": dc,
            "success": success,
            "margin": margin,
            "degree": degree
        }
        
        logger.info("Check resolved", result=result)
        return result
        
    except Exception as e:
        logger.error("Check resolution failed", expression=expression, error=str(e))
        return {"error": f"Check resolution failed: {str(e)}"}

@shared_task
def resolve_damage(expression: str, damage_type: str = "bludgeoning") -> Dict[str, Any]:
    """
    Resolve damage rolls
    
    Args:
        expression: Damage dice expression
        damage_type: Type of damage
    
    Returns:
        Dict with damage results
    """
    try:
        logger.info("Resolving damage", expression=expression, damage_type=damage_type)
        
        roll_result = roll_dice(expression)
        if "error" in roll_result:
            return roll_result
        
        result = {
            **roll_result,
            "damage_type": damage_type
        }
        
        logger.info("Damage resolved", result=result)
        return result
        
    except Exception as e:
        logger.error("Damage resolution failed", expression=expression, error=str(e))
        return {"error": f"Damage resolution failed: {str(e)}"}

def parse_dice_expression(expression: str) -> Dict[int, int]:
    """
    Parse dice expression like "2d20kh1 + 5" into {dice_type: count}
    
    Args:
        expression: Dice expression string
    
    Returns:
        Dict mapping dice type to count
    """
    try:
        # Remove spaces and convert to lowercase
        expr = expression.lower().replace(" ", "")
        
        # Find all dice patterns (e.g., "2d20", "1d6")
        dice_pattern = r'(\d+)d(\d+)'
        matches = re.findall(dice_pattern, expr)
        
        if not matches:
            return {}
        
        dice_counts = {}
        for count, dice_type in matches:
            dice_type = int(dice_type)
            count = int(count)
            dice_counts[dice_type] = dice_counts.get(dice_type, 0) + count
        
        return dice_counts
        
    except Exception as e:
        logger.error("Failed to parse dice expression", expression=expression, error=str(e))
        return {}

@shared_task
def calculate_dc(base_dc: int, modifiers: Dict[str, int] = None) -> int:
    """
    Calculate final DC with modifiers
    
    Args:
        base_dc: Base difficulty class
        modifiers: Modifiers to apply
    
    Returns:
        Final DC
    """
    try:
        final_dc = base_dc
        
        if modifiers:
            for modifier_name, modifier_value in modifiers.items():
                final_dc += modifier_value
        
        logger.info("DC calculated", base_dc=base_dc, modifiers=modifiers, final_dc=final_dc)
        return final_dc
        
    except Exception as e:
        logger.error("DC calculation failed", base_dc=base_dc, error=str(e))
        return base_dc
