from celery import shared_task
import structlog
from typing import Dict, Any, List, Optional
from datetime import datetime
import random

logger = structlog.get_logger()

@shared_task
def roll_initiative(participants: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Roll initiative for all participants in an encounter
    
    Args:
        participants: List of participant data with initiative modifiers
    
    Returns:
        List of participants with initiative rolls and order
    """
    try:
        logger.info("Rolling initiative", participant_count=len(participants))
        
        initiative_results = []
        
        for participant in participants:
            # Roll initiative (1d20 + modifier)
            initiative_roll = random.randint(1, 20)
            modifier = participant.get('initiative_modifier', 0)
            total = initiative_roll + modifier
            
            # Handle advantage/disadvantage
            if participant.get('initiative_advantage') == 'advantage':
                second_roll = random.randint(1, 20)
                total = max(initiative_roll + modifier, second_roll + modifier)
                initiative_roll = max(initiative_roll, second_roll)
            elif participant.get('initiative_advantage') == 'disadvantage':
                second_roll = random.randint(1, 20)
                total = min(initiative_roll + modifier, second_roll + modifier)
                initiative_roll = min(initiative_roll, second_roll)
            
            result = {
                **participant,
                'initiative_roll': initiative_roll,
                'initiative_total': total,
                'initiative_modifier': modifier
            }
            initiative_results.append(result)
        
        # Sort by initiative total (highest first), then by modifier, then randomly
        initiative_results.sort(
            key=lambda x: (x['initiative_total'], x['initiative_modifier'], random.random()),
            reverse=True
        )
        
        # Add turn order
        for i, participant in enumerate(initiative_results):
            participant['turn_order'] = i + 1
        
        logger.info("Initiative rolled", results=initiative_results)
        return initiative_results
        
    except Exception as e:
        logger.error("Initiative roll failed", error=str(e))
        return []

@shared_task
def resolve_attack(
    attacker: Dict[str, Any],
    target: Dict[str, Any],
    attack_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Resolve an attack action
    
    Args:
        attacker: Attacker data
        target: Target data
        attack_data: Attack details (weapon, modifiers, etc.)
    
    Returns:
        Attack resolution result
    """
    try:
        logger.info("Resolving attack", 
                   attacker=attacker.get('name'),
                   target=target.get('name'))
        
        # Roll attack
        attack_roll = random.randint(1, 20)
        attack_modifier = attack_data.get('attack_modifier', 0)
        attack_total = attack_roll + attack_modifier
        
        # Handle advantage/disadvantage
        if attack_data.get('advantage') == 'advantage':
            second_roll = random.randint(1, 20)
            attack_total = max(attack_roll + attack_modifier, second_roll + attack_modifier)
            attack_roll = max(attack_roll, second_roll)
        elif attack_data.get('advantage') == 'disadvantage':
            second_roll = random.randint(1, 20)
            attack_total = min(attack_roll + attack_modifier, second_roll + attack_modifier)
            attack_roll = min(attack_roll, second_roll)
        
        # Determine hit
        ac = target.get('armor_class', 10)
        hit = attack_total >= ac
        critical_hit = attack_roll == 20
        critical_miss = attack_roll == 1
        
        result = {
            'attacker': attacker.get('name'),
            'target': target.get('name'),
            'attack_roll': attack_roll,
            'attack_total': attack_total,
            'target_ac': ac,
            'hit': hit,
            'critical_hit': critical_hit,
            'critical_miss': critical_miss,
            'damage': 0
        }
        
        # Calculate damage if hit
        if hit:
            damage_dice = attack_data.get('damage_dice', '1d6')
            damage_modifier = attack_data.get('damage_modifier', 0)
            
            # Parse damage dice
            dice_count, dice_sides = map(int, damage_dice.split('d'))
            damage_roll = sum(random.randint(1, dice_sides) for _ in range(dice_count))
            
            if critical_hit:
                damage_roll *= 2
            
            total_damage = damage_roll + damage_modifier
            result['damage'] = max(0, total_damage)
            result['damage_roll'] = damage_roll
            result['damage_modifier'] = damage_modifier
        
        logger.info("Attack resolved", result=result)
        return result
        
    except Exception as e:
        logger.error("Attack resolution failed", error=str(e))
        return {'error': f'Attack resolution failed: {str(e)}'}

@shared_task
def resolve_save(
    saver: Dict[str, Any],
    save_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Resolve a saving throw
    
    Args:
        saver: Character making the save
        save_data: Save details (DC, save type, etc.)
    
    Returns:
        Save resolution result
    """
    try:
        logger.info("Resolving save", 
                   saver=saver.get('name'),
                   save_type=save_data.get('save_type'))
        
        # Roll save
        save_roll = random.randint(1, 20)
        save_modifier = save_data.get('save_modifier', 0)
        save_total = save_roll + save_modifier
        
        # Handle advantage/disadvantage
        if save_data.get('advantage') == 'advantage':
            second_roll = random.randint(1, 20)
            save_total = max(save_roll + save_modifier, second_roll + save_modifier)
            save_roll = max(save_roll, second_roll)
        elif save_data.get('advantage') == 'disadvantage':
            second_roll = random.randint(1, 20)
            save_total = min(save_roll + save_modifier, second_roll + save_modifier)
            save_roll = min(save_roll, second_roll)
        
        # Determine success
        dc = save_data.get('dc', 10)
        success = save_total >= dc
        critical_success = save_roll == 20
        critical_failure = save_roll == 1
        
        # Determine degree of success/failure
        if save_total >= dc + 10:
            degree = 'critical_success'
        elif save_total <= dc - 10:
            degree = 'critical_failure'
        elif success:
            degree = 'success'
        else:
            degree = 'failure'
        
        result = {
            'saver': saver.get('name'),
            'save_type': save_data.get('save_type'),
            'save_roll': save_roll,
            'save_total': save_total,
            'dc': dc,
            'success': success,
            'critical_success': critical_success,
            'critical_failure': critical_failure,
            'degree': degree
        }
        
        logger.info("Save resolved", result=result)
        return result
        
    except Exception as e:
        logger.error("Save resolution failed", error=str(e))
        return {'error': f'Save resolution failed: {str(e)}'}

@shared_task
def process_turn(
    actor: Dict[str, Any],
    action: str,
    action_data: Dict[str, Any],
    targets: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Process a combat turn
    
    Args:
        actor: Character taking the turn
        action: Type of action (attack, cast, move, etc.)
        action_data: Action details
        targets: List of targets (if applicable)
    
    Returns:
        Turn resolution result
    """
    try:
        logger.info("Processing turn", 
                   actor=actor.get('name'),
                   action=action)
        
        result = {
            'actor': actor.get('name'),
            'action': action,
            'timestamp': datetime.utcnow().isoformat(),
            'results': []
        }
        
        if action == 'attack':
            if targets:
                for target in targets:
                    attack_result = resolve_attack(actor, target, action_data)
                    result['results'].append(attack_result)
        elif action == 'save':
            save_result = resolve_save(actor, action_data)
            result['results'].append(save_result)
        elif action == 'cast':
            # Handle spell casting
            result['results'].append({
                'type': 'spell_cast',
                'spell': action_data.get('spell_name'),
                'level': action_data.get('spell_level', 1)
            })
        elif action == 'move':
            # Handle movement
            result['results'].append({
                'type': 'movement',
                'distance': action_data.get('distance', 0),
                'direction': action_data.get('direction', 'forward')
            })
        else:
            result['results'].append({
                'type': 'action',
                'description': action_data.get('description', 'Unknown action')
            })
        
        logger.info("Turn processed", result=result)
        return result
        
    except Exception as e:
        logger.error("Turn processing failed", error=str(e))
        return {'error': f'Turn processing failed: {str(e)}'}

@shared_task
def check_combat_end(
    participants: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Check if combat should end based on participant states
    
    Args:
        participants: List of all participants in combat
    
    Returns:
        Combat end check result
    """
    try:
        logger.info("Checking combat end", participant_count=len(participants))
        
        # Count conscious participants by side
        sides = {}
        for participant in participants:
            side = participant.get('side', 'neutral')
            if side not in sides:
                sides[side] = {'conscious': 0, 'total': 0}
            
            sides[side]['total'] += 1
            if participant.get('current_hp', 0) > 0:
                sides[side]['conscious'] += 1
        
        # Check for combat end conditions
        conscious_sides = [side for side, data in sides.items() if data['conscious'] > 0]
        
        if len(conscious_sides) <= 1:
            # Combat should end
            winner = conscious_sides[0] if conscious_sides else None
            result = {
                'combat_should_end': True,
                'winner': winner,
                'reason': 'One or fewer sides have conscious participants',
                'sides': sides
            }
        else:
            result = {
                'combat_should_end': False,
                'sides': sides
            }
        
        logger.info("Combat end check completed", result=result)
        return result
        
    except Exception as e:
        logger.error("Combat end check failed", error=str(e))
        return {'error': f'Combat end check failed: {str(e)}'}
