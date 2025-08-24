from celery import shared_task
import structlog
from typing import Dict, Any, List, Optional
import json
import datetime
from datetime import datetime
import os

logger = structlog.get_logger()

@shared_task
def export_session_journal(
    session_data: Dict[str, Any],
    format: str = 'markdown'
) -> Dict[str, Any]:
    """
    Export a session journal in various formats
    
    Args:
        session_data: Session data including events, rolls, rulings
        format: Export format ('markdown', 'html', 'pdf')
    
    Returns:
        Journal export result with content or file path
    """
    try:
        logger.info("Exporting session journal", 
                   session_id=session_data.get('id'),
                   format=format)
        
        if format == 'markdown':
            content = _generate_markdown_journal(session_data)
        elif format == 'html':
            content = _generate_html_journal(session_data)
        elif format == 'pdf':
            # TODO: Implement PDF generation
            return {
                'success': False,
                'error': 'PDF export not yet implemented'
            }
        else:
            return {
                'success': False,
                'error': f'Unsupported format: {format}'
            }
        
        result = {
            'success': True,
            'format': format,
            'content': content,
            'size': len(content),
            'filename': f"session_journal_{session_data.get('id', 'unknown')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
        }
        
        logger.info("Session journal exported", 
                   filename=result['filename'],
                   size=result['size'])
        
        return result
        
    except Exception as e:
        logger.error("Session journal export failed", error=str(e))
        return {'error': f'Session journal export failed: {str(e)}'}

def _generate_markdown_journal(session_data: Dict[str, Any]) -> str:
    """Generate a markdown journal from session data"""
    lines = []
    
    # Header
    lines.append(f"# Session Journal: {session_data.get('name', 'Unknown Session')}")
    lines.append("")
    
    # Session info
    lines.append("## Session Information")
    lines.append(f"- **Date**: {session_data.get('started_at', 'Unknown')}")
    lines.append(f"- **Duration**: {session_data.get('duration', 'Unknown')}")
    lines.append(f"- **Status**: {session_data.get('status', 'Unknown')}")
    lines.append("")
    
    # Participants
    if session_data.get('participants'):
        lines.append("## Participants")
        for participant in session_data['participants']:
            lines.append(f"- **{participant.get('name', 'Unknown')}** ({participant.get('type', 'Unknown')})")
        lines.append("")
    
    # Events timeline
    if session_data.get('events'):
        lines.append("## Events Timeline")
        for event in session_data['events']:
            timestamp = event.get('timestamp', 'Unknown')
            event_type = event.get('type', 'Unknown')
            description = event.get('description', 'No description')
            
            lines.append(f"### {timestamp} - {event_type}")
            lines.append(description)
            lines.append("")
    
    # Dice rolls
    if session_data.get('rolls'):
        lines.append("## Dice Rolls")
        for roll in session_data['rolls']:
            lines.append(f"- **{roll.get('expression', 'Unknown')}**: {roll.get('result', 'Unknown')}")
        lines.append("")
    
    # Rulings
    if session_data.get('rulings'):
        lines.append("## Rulings")
        for ruling in session_data['rulings']:
            lines.append(f"### {ruling.get('question', 'Unknown Question')}")
            lines.append(f"**Answer**: {ruling.get('answer', 'No answer provided')}")
            lines.append("")
    
    # Combat encounters
    if session_data.get('encounters'):
        lines.append("## Combat Encounters")
        for encounter in session_data['encounters']:
            lines.append(f"### {encounter.get('name', 'Unknown Encounter')}")
            lines.append(f"- **CR**: {encounter.get('challenge_rating', 'Unknown')}")
            lines.append(f"- **Outcome**: {encounter.get('outcome', 'Unknown')}")
            lines.append("")
    
    # Loot found
    if session_data.get('loot'):
        lines.append("## Loot Found")
        total_value = 0
        
        # Coins
        if session_data['loot'].get('coins'):
            lines.append("### Coins")
            for coin_type, amount in session_data['loot']['coins'].items():
                lines.append(f"- {coin_type.title()}: {amount}")
            lines.append("")
        
        # Items
        if session_data['loot'].get('items'):
            lines.append("### Items")
            for item in session_data['loot']['items']:
                lines.append(f"- **{item.get('name', 'Unknown Item')}** ({item.get('rarity', 'Unknown')})")
                if item.get('value'):
                    lines.append(f"  - Value: {item.get('value')} gp")
                if item.get('description'):
                    lines.append(f"  - {item.get('description')}")
                lines.append("")
        
        lines.append(f"**Total Value**: {session_data['loot'].get('total_value', 0)} gp")
        lines.append("")
    
    # Notes
    if session_data.get('notes'):
        lines.append("## Notes")
        lines.append(session_data['notes'])
        lines.append("")
    
    return "\n".join(lines)

def _generate_html_journal(session_data: Dict[str, Any]) -> str:
    """Generate an HTML journal from session data"""
    html_lines = []
    
    # HTML header
    html_lines.append("<!DOCTYPE html>")
    html_lines.append("<html lang='en'>")
    html_lines.append("<head>")
    html_lines.append("    <meta charset='UTF-8'>")
    html_lines.append("    <meta name='viewport' content='width=device-width, initial-scale=1.0'>")
    html_lines.append("    <title>Session Journal</title>")
    html_lines.append("    <style>")
    html_lines.append("        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }")
    html_lines.append("        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }")
    html_lines.append("        h2 { color: #34495e; margin-top: 30px; }")
    html_lines.append("        h3 { color: #7f8c8d; }")
    html_lines.append("        .info { background: #ecf0f1; padding: 15px; border-radius: 5px; }")
    html_lines.append("        .event { margin: 10px 0; padding: 10px; border-left: 3px solid #3498db; }")
    html_lines.append("        .roll { background: #f8f9fa; padding: 5px; margin: 5px 0; }")
    html_lines.append("        .loot-item { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 3px; }")
    html_lines.append("    </style>")
    html_lines.append("</head>")
    html_lines.append("<body>")
    
    # Title
    html_lines.append(f"<h1>Session Journal: {session_data.get('name', 'Unknown Session')}</h1>")
    
    # Session info
    html_lines.append("<div class='info'>")
    html_lines.append("<h2>Session Information</h2>")
    html_lines.append(f"<p><strong>Date:</strong> {session_data.get('started_at', 'Unknown')}</p>")
    html_lines.append(f"<p><strong>Duration:</strong> {session_data.get('duration', 'Unknown')}</p>")
    html_lines.append(f"<p><strong>Status:</strong> {session_data.get('status', 'Unknown')}</p>")
    html_lines.append("</div>")
    
    # Participants
    if session_data.get('participants'):
        html_lines.append("<h2>Participants</h2>")
        html_lines.append("<ul>")
        for participant in session_data['participants']:
            html_lines.append(f"<li><strong>{participant.get('name', 'Unknown')}</strong> ({participant.get('type', 'Unknown')})</li>")
        html_lines.append("</ul>")
    
    # Events timeline
    if session_data.get('events'):
        html_lines.append("<h2>Events Timeline</h2>")
        for event in session_data['events']:
            html_lines.append("<div class='event'>")
            html_lines.append(f"<h3>{event.get('timestamp', 'Unknown')} - {event.get('type', 'Unknown')}</h3>")
            html_lines.append(f"<p>{event.get('description', 'No description')}</p>")
            html_lines.append("</div>")
    
    # Dice rolls
    if session_data.get('rolls'):
        html_lines.append("<h2>Dice Rolls</h2>")
        for roll in session_data['rolls']:
            html_lines.append(f"<div class='roll'><strong>{roll.get('expression', 'Unknown')}:</strong> {roll.get('result', 'Unknown')}</div>")
    
    # Rulings
    if session_data.get('rulings'):
        html_lines.append("<h2>Rulings</h2>")
        for ruling in session_data['rulings']:
            html_lines.append("<div class='event'>")
            html_lines.append(f"<h3>{ruling.get('question', 'Unknown Question')}</h3>")
            html_lines.append(f"<p><strong>Answer:</strong> {ruling.get('answer', 'No answer provided')}</p>")
            html_lines.append("</div>")
    
    # Combat encounters
    if session_data.get('encounters'):
        html_lines.append("<h2>Combat Encounters</h2>")
        for encounter in session_data['encounters']:
            html_lines.append("<div class='event'>")
            html_lines.append(f"<h3>{encounter.get('name', 'Unknown Encounter')}</h3>")
            html_lines.append(f"<p><strong>CR:</strong> {encounter.get('challenge_rating', 'Unknown')}</p>")
            html_lines.append(f"<p><strong>Outcome:</strong> {encounter.get('outcome', 'Unknown')}</p>")
            html_lines.append("</div>")
    
    # Loot found
    if session_data.get('loot'):
        html_lines.append("<h2>Loot Found</h2>")
        
        # Coins
        if session_data['loot'].get('coins'):
            html_lines.append("<h3>Coins</h3>")
            html_lines.append("<ul>")
            for coin_type, amount in session_data['loot']['coins'].items():
                html_lines.append(f"<li>{coin_type.title()}: {amount}</li>")
            html_lines.append("</ul>")
        
        # Items
        if session_data['loot'].get('items'):
            html_lines.append("<h3>Items</h3>")
            for item in session_data['loot']['items']:
                html_lines.append("<div class='loot-item'>")
                html_lines.append(f"<strong>{item.get('name', 'Unknown Item')}</strong> ({item.get('rarity', 'Unknown')})")
                if item.get('value'):
                    html_lines.append(f"<br>Value: {item.get('value')} gp")
                if item.get('description'):
                    html_lines.append(f"<br>{item.get('description')}")
                html_lines.append("</div>")
        
        html_lines.append(f"<p><strong>Total Value:</strong> {session_data['loot'].get('total_value', 0)} gp</p>")
    
    # Notes
    if session_data.get('notes'):
        html_lines.append("<h2>Notes</h2>")
        html_lines.append(f"<p>{session_data['notes']}</p>")
    
    # HTML footer
    html_lines.append("</body>")
    html_lines.append("</html>")
    
    return "\n".join(html_lines)

@shared_task
def export_encounter_card(
    encounter_data: Dict[str, Any],
    format: str = 'json'
) -> Dict[str, Any]:
    """
    Export an encounter card for VTT import
    
    Args:
        encounter_data: Encounter data including monsters, map, etc.
        format: Export format ('json', 'foundry', 'roll20')
    
    Returns:
        Encounter card export result
    """
    try:
        logger.info("Exporting encounter card", 
                   encounter_id=encounter_data.get('id'),
                   format=format)
        
        if format == 'json':
            content = json.dumps(encounter_data, indent=2)
        elif format == 'foundry':
            content = _generate_foundry_encounter(encounter_data)
        elif format == 'roll20':
            content = _generate_roll20_encounter(encounter_data)
        else:
            return {
                'success': False,
                'error': f'Unsupported format: {format}'
            }
        
        result = {
            'success': True,
            'format': format,
            'content': content,
            'size': len(content),
            'filename': f"encounter_{encounter_data.get('id', 'unknown')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format}"
        }
        
        logger.info("Encounter card exported", 
                   filename=result['filename'],
                   size=result['size'])
        
        return result
        
    except Exception as e:
        logger.error("Encounter card export failed", error=str(e))
        return {'error': f'Encounter card export failed: {str(e)}'}

def _generate_foundry_encounter(encounter_data: Dict[str, Any]) -> str:
    """Generate Foundry VTT encounter format"""
    foundry_data = {
        'name': encounter_data.get('name', 'Unknown Encounter'),
        'description': encounter_data.get('description', ''),
        'actors': [],
        'tokens': [],
        'combat': {
            'round': 1,
            'turn': 0,
            'combatants': []
        }
    }
    
    # Add actors
    for participant in encounter_data.get('participants', []):
        actor = {
            'name': participant.get('name', 'Unknown'),
            'type': participant.get('type', 'npc'),
            'img': participant.get('image', ''),
            'system': {
                'attributes': {
                    'hp': {
                        'value': participant.get('hp', 0),
                        'max': participant.get('max_hp', 0)
                    },
                    'ac': {
                        'value': participant.get('armor_class', 10)
                    }
                }
            }
        }
        foundry_data['actors'].append(actor)
    
    return json.dumps(foundry_data, indent=2)

def _generate_roll20_encounter(encounter_data: Dict[str, Any]) -> str:
    """Generate Roll20 encounter format"""
    roll20_data = {
        'name': encounter_data.get('name', 'Unknown Encounter'),
        'description': encounter_data.get('description', ''),
        'characters': [],
        'handouts': []
    }
    
    # Add characters
    for participant in encounter_data.get('participants', []):
        character = {
            'name': participant.get('name', 'Unknown'),
            'avatar': participant.get('image', ''),
            'bio': participant.get('description', ''),
            'attributes': {
                'HP': participant.get('hp', 0),
                'Max HP': participant.get('max_hp', 0),
                'AC': participant.get('armor_class', 10)
            }
        }
        roll20_data['characters'].append(character)
    
    return json.dumps(roll20_data, indent=2)

@shared_task
def export_vtt_bundle(
    session_data: Dict[str, Any],
    include_maps: bool = True,
    include_tokens: bool = True,
    include_journal: bool = True
) -> Dict[str, Any]:
    """
    Export a complete VTT bundle for the session
    
    Args:
        session_data: Complete session data
        include_maps: Whether to include map data
        include_tokens: Whether to include token data
        include_journal: Whether to include journal data
    
    Returns:
        VTT bundle export result
    """
    try:
        logger.info("Exporting VTT bundle", 
                   session_id=session_data.get('id'),
                   include_maps=include_maps,
                   include_tokens=include_tokens,
                   include_journal=include_journal)
        
        bundle = {
            'metadata': {
                'session_id': session_data.get('id'),
                'session_name': session_data.get('name', 'Unknown Session'),
                'export_date': datetime.now().isoformat(),
                'version': '1.0'
            },
            'maps': [],
            'tokens': [],
            'journal': None,
            'encounters': []
        }
        
        # Add maps
        if include_maps and session_data.get('maps'):
            for map_data in session_data['maps']:
                bundle['maps'].append({
                    'id': map_data.get('id'),
                    'name': map_data.get('name'),
                    'width': map_data.get('width'),
                    'height': map_data.get('height'),
                    'grid_type': map_data.get('grid_type'),
                    'grid_size': map_data.get('grid_size'),
                    'background': map_data.get('background')
                })
        
        # Add tokens
        if include_tokens and session_data.get('tokens'):
            for token_data in session_data['tokens']:
                bundle['tokens'].append({
                    'id': token_data.get('id'),
                    'name': token_data.get('name'),
                    'x': token_data.get('x'),
                    'y': token_data.get('y'),
                    'size': token_data.get('size'),
                    'appearance': token_data.get('appearance')
                })
        
        # Add journal
        if include_journal:
            bundle['journal'] = _generate_markdown_journal(session_data)
        
        # Add encounters
        if session_data.get('encounters'):
            for encounter in session_data['encounters']:
                bundle['encounters'].append({
                    'id': encounter.get('id'),
                    'name': encounter.get('name'),
                    'participants': encounter.get('participants', []),
                    'initiative_order': encounter.get('initiative_order', [])
                })
        
        result = {
            'success': True,
            'format': 'vtt_bundle',
            'content': json.dumps(bundle, indent=2),
            'size': len(json.dumps(bundle)),
            'filename': f"vtt_bundle_{session_data.get('id', 'unknown')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        }
        
        logger.info("VTT bundle exported", 
                   filename=result['filename'],
                   size=result['size'])
        
        return result
        
    except Exception as e:
        logger.error("VTT bundle export failed", error=str(e))
        return {'error': f'VTT bundle export failed: {str(e)}'}
