from celery import shared_task
import structlog
from typing import Dict, Any, List, Optional
import random
import json

logger = structlog.get_logger()

@shared_task
def generate_treasure_hoard(
    challenge_rating: float,
    hoard_type: str = 'standard',
    party_size: int = 4,
    party_level: int = 1
) -> Dict[str, Any]:
    """
    Generate a treasure hoard based on challenge rating and type
    
    Args:
        challenge_rating: CR of the encounter
        hoard_type: Type of hoard ('standard', 'individual', 'lair')
        party_size: Number of players
        party_level: Average party level
    
    Returns:
        Treasure hoard with coins, gems, art objects, and magic items
    """
    try:
        logger.info("Generating treasure hoard", 
                   cr=challenge_rating,
                   hoard_type=hoard_type,
                   party_size=party_size,
                   party_level=party_level)
        
        hoard = {
            'coins': _generate_coins(challenge_rating, hoard_type),
            'gems': _generate_gems(challenge_rating, hoard_type),
            'art_objects': _generate_art_objects(challenge_rating, hoard_type),
            'magic_items': _generate_magic_items(challenge_rating, hoard_type, party_level),
            'total_value': 0,
            'rarity_breakdown': {}
        }
        
        # Calculate total value
        total_value = 0
        rarity_counts = {}
        
        # Coins
        for coin_type, amount in hoard['coins'].items():
            coin_values = {
                'copper': 0.01,
                'silver': 0.1,
                'electrum': 0.5,
                'gold': 1,
                'platinum': 10
            }
            total_value += amount * coin_values.get(coin_type, 0)
        
        # Gems
        for gem in hoard['gems']:
            total_value += gem.get('value', 0)
            rarity = gem.get('rarity', 'common')
            rarity_counts[rarity] = rarity_counts.get(rarity, 0) + 1
        
        # Art objects
        for art in hoard['art_objects']:
            total_value += art.get('value', 0)
            rarity = art.get('rarity', 'common')
            rarity_counts[rarity] = rarity_counts.get(rarity, 0) + 1
        
        # Magic items
        for item in hoard['magic_items']:
            total_value += item.get('value', 0)
            rarity = item.get('rarity', 'common')
            rarity_counts[rarity] = rarity_counts.get(rarity, 0) + 1
        
        hoard['total_value'] = total_value
        hoard['rarity_breakdown'] = rarity_counts
        
        logger.info("Treasure hoard generated", 
                   total_value=total_value,
                   item_count=len(hoard['magic_items']) + len(hoard['gems']) + len(hoard['art_objects']))
        
        return hoard
        
    except Exception as e:
        logger.error("Treasure hoard generation failed", error=str(e))
        return {'error': f'Treasure hoard generation failed: {str(e)}'}

def _generate_coins(cr: float, hoard_type: str) -> Dict[str, int]:
    """Generate coin amounts based on CR and hoard type"""
    base_multiplier = {
        'individual': 0.1,
        'standard': 1.0,
        'lair': 2.0
    }
    
    multiplier = base_multiplier.get(hoard_type, 1.0)
    
    # Base coin amounts by CR tier
    coin_tables = {
        (0, 4): {'copper': (5, 6), 'silver': (4, 6), 'gold': (0, 0)},
        (5, 10): {'copper': (0, 0), 'silver': (0, 0), 'gold': (6, 6), 'electrum': (0, 0)},
        (11, 16): {'copper': (0, 0), 'silver': (0, 0), 'gold': (4, 5), 'platinum': (0, 0)},
        (17, 20): {'copper': (0, 0), 'silver': (0, 0), 'gold': (12, 12), 'platinum': (8, 8)}
    }
    
    # Find appropriate tier
    tier = None
    for (min_cr, max_cr) in coin_tables.keys():
        if min_cr <= cr <= max_cr:
            tier = (min_cr, max_cr)
            break
    
    if not tier:
        tier = (0, 4)  # Default to lowest tier
    
    coins = {}
    for coin_type, (dice_count, dice_sides) in coin_tables[tier].items():
        if dice_count > 0:
            amount = sum(random.randint(1, dice_sides) for _ in range(dice_count))
            coins[coin_type] = int(amount * 100 * multiplier)  # Convert to actual coin amounts
    
    return coins

def _generate_gems(cr: float, hoard_type: str) -> List[Dict[str, Any]]:
    """Generate gemstones based on CR and hoard type"""
    gems = []
    
    # Gem tables by CR tier
    gem_tables = {
        (0, 4): [('common', 10, 50), ('uncommon', 50, 100)],
        (5, 10): [('uncommon', 50, 100), ('rare', 100, 500)],
        (11, 16): [('rare', 100, 500), ('very_rare', 500, 1000)],
        (17, 20): [('very_rare', 500, 1000), ('legendary', 1000, 5000)]
    }
    
    # Find appropriate tier
    tier = None
    for (min_cr, max_cr) in gem_tables.keys():
        if min_cr <= cr <= max_cr:
            tier = (min_cr, max_cr)
            break
    
    if not tier:
        tier = (0, 4)  # Default to lowest tier
    
    # Generate gems
    for rarity, min_value, max_value in gem_tables[tier]:
        if random.random() < 0.3:  # 30% chance for each gem type
            gem = {
                'name': _get_random_gem_name(rarity),
                'rarity': rarity,
                'value': random.randint(min_value, max_value),
                'description': _get_gem_description(rarity)
            }
            gems.append(gem)
    
    return gems

def _generate_art_objects(cr: float, hoard_type: str) -> List[Dict[str, Any]]:
    """Generate art objects based on CR and hoard type"""
    art_objects = []
    
    # Art object tables by CR tier
    art_tables = {
        (0, 4): [('common', 25, 100)],
        (5, 10): [('uncommon', 250, 750)],
        (11, 16): [('rare', 750, 2500)],
        (17, 20): [('very_rare', 2500, 7500)]
    }
    
    # Find appropriate tier
    tier = None
    for (min_cr, max_cr) in art_tables.keys():
        if min_cr <= cr <= max_cr:
            tier = (min_cr, max_cr)
            break
    
    if not tier:
        tier = (0, 4)  # Default to lowest tier
    
    # Generate art objects
    for rarity, min_value, max_value in art_tables[tier]:
        if random.random() < 0.2:  # 20% chance for each art object type
            art = {
                'name': _get_random_art_name(rarity),
                'rarity': rarity,
                'value': random.randint(min_value, max_value),
                'description': _get_art_description(rarity)
            }
            art_objects.append(art)
    
    return art_objects

def _generate_magic_items(cr: float, hoard_type: str, party_level: int) -> List[Dict[str, Any]]:
    """Generate magic items based on CR, hoard type, and party level"""
    magic_items = []
    
    # Magic item tables by CR tier
    item_tables = {
        (0, 4): [('common', 0.1), ('uncommon', 0.05)],
        (5, 10): [('uncommon', 0.15), ('rare', 0.08)],
        (11, 16): [('rare', 0.12), ('very_rare', 0.06)],
        (17, 20): [('very_rare', 0.1), ('legendary', 0.04)]
    }
    
    # Find appropriate tier
    tier = None
    for (min_cr, max_cr) in item_tables.keys():
        if min_cr <= cr <= max_cr:
            tier = (min_cr, max_cr)
            break
    
    if not tier:
        tier = (0, 4)  # Default to lowest tier
    
    # Generate magic items
    for rarity, chance in item_tables[tier]:
        if random.random() < chance:
            item = _generate_magic_item(rarity, party_level)
            if item:
                magic_items.append(item)
    
    return magic_items

def _generate_magic_item(rarity: str, party_level: int) -> Optional[Dict[str, Any]]:
    """Generate a specific magic item of given rarity"""
    # Magic item database (simplified)
    magic_items_db = {
        'common': [
            {'name': 'Potion of Healing', 'type': 'potion', 'value': 50},
            {'name': 'Scroll of Magic Missile', 'type': 'scroll', 'value': 25},
            {'name': 'Ring of Protection', 'type': 'ring', 'value': 100}
        ],
        'uncommon': [
            {'name': 'Bag of Holding', 'type': 'wondrous', 'value': 500},
            {'name': 'Potion of Greater Healing', 'type': 'potion', 'value': 150},
            {'name': 'Scroll of Fireball', 'type': 'scroll', 'value': 150}
        ],
        'rare': [
            {'name': 'Sword of Sharpness', 'type': 'weapon', 'value': 2000},
            {'name': 'Ring of Invisibility', 'type': 'ring', 'value': 5000},
            {'name': 'Potion of Superior Healing', 'type': 'potion', 'value': 450}
        ],
        'very_rare': [
            {'name': 'Staff of Power', 'type': 'staff', 'value': 20000},
            {'name': 'Ring of Three Wishes', 'type': 'ring', 'value': 50000},
            {'name': 'Potion of Supreme Healing', 'type': 'potion', 'value': 1350}
        ],
        'legendary': [
            {'name': 'Holy Avenger', 'type': 'weapon', 'value': 100000},
            {'name': 'Ring of Elemental Command', 'type': 'ring', 'value': 200000},
            {'name': 'Potion of Vitality', 'type': 'potion', 'value': 5000}
        ]
    }
    
    items = magic_items_db.get(rarity, [])
    if not items:
        return None
    
    base_item = random.choice(items)
    
    return {
        'name': base_item['name'],
        'type': base_item['type'],
        'rarity': rarity,
        'value': base_item['value'],
        'description': _get_magic_item_description(base_item['name'], rarity),
        'attunement_required': rarity in ['rare', 'very_rare', 'legendary']
    }

def _get_random_gem_name(rarity: str) -> str:
    """Get a random gem name based on rarity"""
    gem_names = {
        'common': ['Amethyst', 'Citrine', 'Garnet', 'Jasper', 'Moonstone'],
        'uncommon': ['Aquamarine', 'Pearl', 'Topaz', 'Turquoise', 'Zircon'],
        'rare': ['Diamond', 'Emerald', 'Ruby', 'Sapphire', 'Opal'],
        'very_rare': ['Black Pearl', 'Star Ruby', 'Star Sapphire', 'Alexandrite'],
        'legendary': ['Crown Jewel', 'Heart of the Mountain', 'Tears of the Goddess']
    }
    
    gems = gem_names.get(rarity, ['Gemstone'])
    return random.choice(gems)

def _get_gem_description(rarity: str) -> str:
    """Get a description for a gem based on rarity"""
    descriptions = {
        'common': 'A simple but beautiful gemstone.',
        'uncommon': 'A well-cut gemstone of good quality.',
        'rare': 'A precious gemstone of exceptional quality.',
        'very_rare': 'A magnificent gemstone of legendary beauty.',
        'legendary': 'A gemstone of such beauty it seems to glow with inner light.'
    }
    
    return descriptions.get(rarity, 'A gemstone.')

def _get_random_art_name(rarity: str) -> str:
    """Get a random art object name based on rarity"""
    art_names = {
        'common': ['Silver Ring', 'Bronze Statuette', 'Carved Wooden Box'],
        'uncommon': ['Gold Bracelet', 'Silver Goblet', 'Painted Canvas'],
        'rare': ['Platinum Crown', 'Masterwork Painting', 'Jeweled Necklace'],
        'very_rare': ['Crown of the Ancient Kings', 'Masterpiece Portrait', 'Dragon\'s Hoard Piece']
    }
    
    art_objects = art_names.get(rarity, ['Art Object'])
    return random.choice(art_objects)

def _get_art_description(rarity: str) -> str:
    """Get a description for an art object based on rarity"""
    descriptions = {
        'common': 'A simple but well-crafted piece.',
        'uncommon': 'A finely crafted work of art.',
        'rare': 'A masterpiece of artistic skill.',
        'very_rare': 'A legendary work of art of unsurpassed beauty.'
    }
    
    return descriptions.get(rarity, 'A work of art.')

def _get_magic_item_description(name: str, rarity: str) -> str:
    """Get a description for a magic item"""
    return f"A {rarity} magic item of great power."

@shared_task
def generate_individual_treasure(
    challenge_rating: float,
    creature_type: str = 'humanoid'
) -> Dict[str, Any]:
    """
    Generate individual treasure for a creature
    
    Args:
        challenge_rating: CR of the creature
        creature_type: Type of creature
    
    Returns:
        Individual treasure with coins and small items
    """
    try:
        logger.info("Generating individual treasure", 
                   cr=challenge_rating,
                   creature_type=creature_type)
        
        treasure = {
            'coins': _generate_coins(challenge_rating, 'individual'),
            'small_items': _generate_small_items(challenge_rating, creature_type),
            'total_value': 0
        }
        
        # Calculate total value
        total_value = 0
        for coin_type, amount in treasure['coins'].items():
            coin_values = {
                'copper': 0.01,
                'silver': 0.1,
                'electrum': 0.5,
                'gold': 1,
                'platinum': 10
            }
            total_value += amount * coin_values.get(coin_type, 0)
        
        for item in treasure['small_items']:
            total_value += item.get('value', 0)
        
        treasure['total_value'] = total_value
        
        logger.info("Individual treasure generated", total_value=total_value)
        return treasure
        
    except Exception as e:
        logger.error("Individual treasure generation failed", error=str(e))
        return {'error': f'Individual treasure generation failed: {str(e)}'}

def _generate_small_items(cr: float, creature_type: str) -> List[Dict[str, Any]]:
    """Generate small items based on CR and creature type"""
    items = []
    
    # Small item tables
    small_items = [
        {'name': 'Silver Ring', 'value': 10, 'chance': 0.1},
        {'name': 'Bronze Statuette', 'value': 25, 'chance': 0.05},
        {'name': 'Carved Wooden Box', 'value': 15, 'chance': 0.08},
        {'name': 'Silver Goblet', 'value': 50, 'chance': 0.03},
        {'name': 'Gold Bracelet', 'value': 100, 'chance': 0.02}
    ]
    
    for item in small_items:
        if random.random() < item['chance']:
            items.append({
                'name': item['name'],
                'value': item['value'],
                'description': f'A small {item["name"].lower()}.'
            })
    
    return items
