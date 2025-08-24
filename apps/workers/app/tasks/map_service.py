from celery import shared_task
import structlog
from typing import Dict, Any, List, Optional, Tuple
import json
import math

logger = structlog.get_logger()

@shared_task
def generate_map_grid(
    width: int,
    height: int,
    grid_size: int = 50,
    grid_type: str = 'square'
) -> Dict[str, Any]:
    """
    Generate a grid for a map
    
    Args:
        width: Map width in pixels
        height: Map height in pixels
        grid_size: Size of each grid cell in pixels
        grid_type: Type of grid ('square', 'hex')
    
    Returns:
        Grid configuration and cell data
    """
    try:
        logger.info("Generating map grid", 
                   width=width, 
                   height=height, 
                   grid_size=grid_size, 
                   grid_type=grid_type)
        
        if grid_type == 'square':
            return _generate_square_grid(width, height, grid_size)
        elif grid_type == 'hex':
            return _generate_hex_grid(width, height, grid_size)
        else:
            raise ValueError(f"Unsupported grid type: {grid_type}")
            
    except Exception as e:
        logger.error("Grid generation failed", error=str(e))
        return {'error': f'Grid generation failed: {str(e)}'}

def _generate_square_grid(width: int, height: int, grid_size: int) -> Dict[str, Any]:
    """Generate a square grid"""
    cols = math.ceil(width / grid_size)
    rows = math.ceil(height / grid_size)
    
    cells = []
    for row in range(rows):
        for col in range(cols):
            cell = {
                'id': f"{row}_{col}",
                'row': row,
                'col': col,
                'x': col * grid_size,
                'y': row * grid_size,
                'width': grid_size,
                'height': grid_size,
                'center_x': col * grid_size + grid_size // 2,
                'center_y': row * grid_size + grid_size // 2
            }
            cells.append(cell)
    
    return {
        'grid_type': 'square',
        'grid_size': grid_size,
        'cols': cols,
        'rows': rows,
        'cells': cells,
        'total_cells': len(cells)
    }

def _generate_hex_grid(width: int, height: int, grid_size: int) -> Dict[str, Any]:
    """Generate a hexagonal grid"""
    # Hex grid calculations
    hex_width = grid_size * 2
    hex_height = grid_size * math.sqrt(3)
    
    cols = math.ceil(width / (hex_width * 0.75))
    rows = math.ceil(height / hex_height)
    
    cells = []
    for row in range(rows):
        for col in range(cols):
            x = col * hex_width * 0.75
            y = row * hex_height
            if col % 2 == 1:
                y += hex_height / 2
            
            cell = {
                'id': f"{row}_{col}",
                'row': row,
                'col': col,
                'x': x,
                'y': y,
                'width': hex_width,
                'height': hex_height,
                'center_x': x + hex_width // 2,
                'center_y': y + hex_height // 2,
                'points': _calculate_hex_points(x, y, grid_size)
            }
            cells.append(cell)
    
    return {
        'grid_type': 'hex',
        'grid_size': grid_size,
        'cols': cols,
        'rows': rows,
        'cells': cells,
        'total_cells': len(cells)
    }

def _calculate_hex_points(center_x: float, center_y: float, size: int) -> List[Tuple[float, float]]:
    """Calculate the six points of a hexagon"""
    points = []
    for i in range(6):
        angle = i * math.pi / 3
        x = center_x + size * math.cos(angle)
        y = center_y + size * math.sin(angle)
        points.append((x, y))
    return points

@shared_task
def calculate_distance(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    grid_type: str = 'square'
) -> Dict[str, Any]:
    """
    Calculate distance between two points on a grid
    
    Args:
        x1, y1: First point coordinates
        x2, y2: Second point coordinates
        grid_type: Type of grid ('square', 'hex')
    
    Returns:
        Distance calculation result
    """
    try:
        logger.info("Calculating distance", 
                   x1=x1, y1=y1, x2=x2, y2=y2, grid_type=grid_type)
        
        if grid_type == 'square':
            # Manhattan distance for square grid
            distance = abs(x2 - x1) + abs(y2 - y1)
            return {
                'distance': distance,
                'grid_type': grid_type,
                'method': 'manhattan'
            }
        elif grid_type == 'hex':
            # Hex distance calculation
            distance = _calculate_hex_distance(x1, y1, x2, y2)
            return {
                'distance': distance,
                'grid_type': grid_type,
                'method': 'hex'
            }
        else:
            # Euclidean distance as fallback
            distance = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            return {
                'distance': distance,
                'grid_type': grid_type,
                'method': 'euclidean'
            }
            
    except Exception as e:
        logger.error("Distance calculation failed", error=str(e))
        return {'error': f'Distance calculation failed: {str(e)}'}

def _calculate_hex_distance(x1: float, y1: float, x2: float, y2: float) -> float:
    """Calculate distance on a hex grid"""
    # Convert to hex coordinates
    q1 = (x1 * math.sqrt(3) / 3 - y1 / 3)
    r1 = y1 * 2 / 3
    q2 = (x2 * math.sqrt(3) / 3 - y2 / 3)
    r2 = y2 * 2 / 3
    
    # Hex distance formula
    return (abs(q1 - q2) + abs(r1 - r2) + abs(q1 + r1 - q2 - r2)) / 2

@shared_task
def place_token(
    token_data: Dict[str, Any],
    map_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Place a token on the map
    
    Args:
        token_data: Token information (position, size, type, etc.)
        map_data: Map configuration and grid data
    
    Returns:
        Token placement result with grid position
    """
    try:
        logger.info("Placing token", 
                   token_name=token_data.get('name'),
                   x=token_data.get('x'),
                   y=token_data.get('y'))
        
        x = token_data.get('x', 0)
        y = token_data.get('y', 0)
        grid_size = map_data.get('grid_size', 50)
        grid_type = map_data.get('grid_type', 'square')
        
        # Calculate grid position
        if grid_type == 'square':
            grid_x = int(x // grid_size)
            grid_y = int(y // grid_size)
        else:  # hex
            # Convert to hex coordinates
            grid_x = int(x // (grid_size * 1.5))
            grid_y = int(y // (grid_size * math.sqrt(3)))
        
        # Validate placement
        if not _is_valid_position(grid_x, grid_y, map_data):
            return {
                'success': False,
                'error': 'Position outside map bounds'
            }
        
        # Check for collision with other tokens
        if _check_token_collision(token_data, map_data):
            return {
                'success': False,
                'error': 'Token collision detected'
            }
        
        result = {
            'success': True,
            'token_id': token_data.get('id'),
            'grid_x': grid_x,
            'grid_y': grid_y,
            'pixel_x': x,
            'pixel_y': y,
            'cell_id': f"{grid_y}_{grid_x}"
        }
        
        logger.info("Token placed successfully", result=result)
        return result
        
    except Exception as e:
        logger.error("Token placement failed", error=str(e))
        return {'error': f'Token placement failed: {str(e)}'}

def _is_valid_position(grid_x: int, grid_y: int, map_data: Dict[str, Any]) -> bool:
    """Check if a grid position is valid"""
    cols = map_data.get('cols', 0)
    rows = map_data.get('rows', 0)
    return 0 <= grid_x < cols and 0 <= grid_y < rows

def _check_token_collision(token_data: Dict[str, Any], map_data: Dict[str, Any]) -> bool:
    """Check if token placement would collide with existing tokens"""
    # TODO: Implement collision detection with existing tokens
    # For now, assume no collision
    return False

@shared_task
def calculate_line_of_sight(
    start_x: float,
    start_y: float,
    end_x: float,
    end_y: float,
    map_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate line of sight between two points
    
    Args:
        start_x, start_y: Starting point coordinates
        end_x, end_y: Ending point coordinates
        map_data: Map configuration with obstacles
    
    Returns:
        Line of sight calculation result
    """
    try:
        logger.info("Calculating line of sight", 
                   start=(start_x, start_y),
                   end=(end_x, end_y))
        
        # Get obstacles from map data
        obstacles = map_data.get('obstacles', [])
        
        # Simple line of sight calculation
        has_line_of_sight = True
        blocked_points = []
        
        # Check if line intersects with any obstacles
        for obstacle in obstacles:
            if _line_intersects_obstacle(start_x, start_y, end_x, end_y, obstacle):
                has_line_of_sight = False
                blocked_points.append(obstacle)
                break
        
        result = {
            'has_line_of_sight': has_line_of_sight,
            'start_point': (start_x, start_y),
            'end_point': (end_x, end_y),
            'blocked_by': blocked_points,
            'distance': math.sqrt((end_x - start_x) ** 2 + (end_y - start_y) ** 2)
        }
        
        logger.info("Line of sight calculated", result=result)
        return result
        
    except Exception as e:
        logger.error("Line of sight calculation failed", error=str(e))
        return {'error': f'Line of sight calculation failed: {str(e)}'}

def _line_intersects_obstacle(
    x1: float, y1: float, 
    x2: float, y2: float, 
    obstacle: Dict[str, Any]
) -> bool:
    """Check if a line intersects with an obstacle"""
    # Simple rectangle intersection check
    ox = obstacle.get('x', 0)
    oy = obstacle.get('y', 0)
    ow = obstacle.get('width', 0)
    oh = obstacle.get('height', 0)
    
    # Check if line intersects with rectangle
    return _line_intersects_rectangle(x1, y1, x2, y2, ox, oy, ow, oh)

def _line_intersects_rectangle(
    x1: float, y1: float, 
    x2: float, y2: float,
    rx: float, ry: float, 
    rw: float, rh: float
) -> bool:
    """Check if line intersects with rectangle"""
    # Check if either endpoint is inside the rectangle
    if (rx <= x1 <= rx + rw and ry <= y1 <= ry + rh) or \
       (rx <= x2 <= rx + rw and ry <= y2 <= ry + rh):
        return True
    
    # Check if line intersects with any of the rectangle's edges
    edges = [
        (rx, ry, rx + rw, ry),           # Top edge
        (rx + rw, ry, rx + rw, ry + rh), # Right edge
        (rx, ry + rh, rx + rw, ry + rh), # Bottom edge
        (rx, ry, rx, ry + rh)            # Left edge
    ]
    
    for ex1, ey1, ex2, ey2 in edges:
        if _lines_intersect(x1, y1, x2, y2, ex1, ey1, ex2, ey2):
            return True
    
    return False

def _lines_intersect(
    x1: float, y1: float, x2: float, y2: float,
    x3: float, y3: float, x4: float, y4: float
) -> bool:
    """Check if two line segments intersect"""
    def ccw(A, B, C):
        return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])
    
    A = (x1, y1)
    B = (x2, y2)
    C = (x3, y3)
    D = (x4, y4)
    
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

@shared_task
def export_map(
    map_data: Dict[str, Any],
    format: str = 'json'
) -> Dict[str, Any]:
    """
    Export map data in various formats
    
    Args:
        map_data: Map configuration and data
        format: Export format ('json', 'png', 'svg')
    
    Returns:
        Export result with data or file path
    """
    try:
        logger.info("Exporting map", format=format)
        
        if format == 'json':
            return {
                'success': True,
                'format': format,
                'data': map_data,
                'size': len(json.dumps(map_data))
            }
        elif format == 'png':
            # TODO: Implement PNG export
            return {
                'success': False,
                'error': 'PNG export not yet implemented'
            }
        elif format == 'svg':
            # TODO: Implement SVG export
            return {
                'success': False,
                'error': 'SVG export not yet implemented'
            }
        else:
            return {
                'success': False,
                'error': f'Unsupported format: {format}'
            }
            
    except Exception as e:
        logger.error("Map export failed", error=str(e))
        return {'error': f'Map export failed: {str(e)}'}
