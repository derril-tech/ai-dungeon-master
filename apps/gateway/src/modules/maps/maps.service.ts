import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Map, Token, MapType, GridType } from './map.entity';
import { CreateMapDto } from './dto/create-map.dto';
import { CreateTokenDto } from './dto/create-token.dto';

@Injectable()
export class MapsService {
  constructor(
    @InjectRepository(Map)
    private mapRepository: Repository<Map>,
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
  ) {}

  async createMap(createMapDto: CreateMapDto): Promise<Map> {
    const map = this.mapRepository.create(createMapDto);
    
    // Generate grid data if grid type is specified
    if (map.grid_type !== GridType.NONE) {
      // TODO: Call workers service for grid generation
      map.grid_data = {
        grid_type: map.grid_type,
        grid_size: map.grid_size,
        cols: Math.ceil(map.width / map.grid_size),
        rows: Math.ceil(map.height / map.grid_size)
      };
    }
    
    return await this.mapRepository.save(map);
  }

  async getMap(id: string): Promise<Map> {
    return await this.mapRepository.findOne({
      where: { id },
      relations: ['tokens']
    });
  }

  async getMapsByCampaign(campaignId: string): Promise<Map[]> {
    return await this.mapRepository.find({
      where: { campaign_id: campaignId },
      order: { created_at: 'DESC' }
    });
  }

  async updateMap(id: string, updateData: Partial<Map>): Promise<Map> {
    await this.mapRepository.update(id, updateData);
    return await this.getMap(id);
  }

  async deleteMap(id: string): Promise<void> {
    await this.mapRepository.delete(id);
  }

  async createToken(createTokenDto: CreateTokenDto): Promise<Token> {
    const token = this.tokenRepository.create(createTokenDto);
    
    // Get map data for grid calculations
    const map = await this.getMap(createTokenDto.map_id);
    
    // Calculate grid position if not provided
    if (token.grid_x === undefined || token.grid_y === undefined) {
      const gridPosition = this.calculateGridPosition(token.x, token.y, map);
      token.grid_x = gridPosition.x;
      token.grid_y = gridPosition.y;
    }
    
    return await this.tokenRepository.save(token);
  }

  async getToken(id: string): Promise<Token> {
    return await this.tokenRepository.findOne({
      where: { id },
      relations: ['map']
    });
  }

  async getTokensByMap(mapId: string): Promise<Token[]> {
    return await this.tokenRepository.find({
      where: { map_id: mapId },
      order: { layer: 'ASC', created_at: 'ASC' }
    });
  }

  async updateToken(id: string, updateData: Partial<Token>): Promise<Token> {
    await this.tokenRepository.update(id, updateData);
    return await this.getToken(id);
  }

  async moveToken(id: string, x: number, y: number): Promise<Token> {
    const token = await this.getToken(id);
    const map = await this.getMap(token.map_id);
    
    // Calculate new grid position
    const gridPosition = this.calculateGridPosition(x, y, map);
    
    await this.tokenRepository.update(id, {
      x,
      y,
      grid_x: gridPosition.x,
      grid_y: gridPosition.y
    });
    
    return await this.getToken(id);
  }

  async deleteToken(id: string): Promise<void> {
    await this.tokenRepository.delete(id);
  }

  async calculateDistance(
    mapId: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Promise<any> {
    const map = await this.getMap(mapId);
    
    // TODO: Call workers service for distance calculation
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    
    return {
      distance,
      grid_type: map.grid_type,
      method: 'euclidean'
    };
  }

  async calculateLineOfSight(
    mapId: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Promise<any> {
    const map = await this.getMap(mapId);
    
    // TODO: Call workers service for line of sight calculation
    // For now, assume line of sight is always clear
    return {
      has_line_of_sight: true,
      start_point: [startX, startY],
      end_point: [endX, endY],
      distance: Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
    };
  }

  async exportMap(mapId: string, format: string = 'json'): Promise<any> {
    const map = await this.getMap(mapId);
    
    // TODO: Call workers service for map export
    if (format === 'json') {
      return {
        success: true,
        format,
        data: map,
        size: JSON.stringify(map).length
      };
    }
    
    return {
      success: false,
      error: `Export format '${format}' not supported`
    };
  }

  private calculateGridPosition(x: number, y: number, map: Map): { x: number; y: number } {
    if (map.grid_type === GridType.NONE) {
      return { x: 0, y: 0 };
    }
    
    const gridSize = map.grid_size;
    
    if (map.grid_type === GridType.SQUARE) {
      return {
        x: Math.floor(x / gridSize),
        y: Math.floor(y / gridSize)
      };
    } else if (map.grid_type === GridType.HEX) {
      // Hex grid calculations
      const hexWidth = gridSize * 2;
      const hexHeight = gridSize * Math.sqrt(3);
      
      const col = Math.floor(x / (hexWidth * 0.75));
      const row = Math.floor(y / hexHeight);
      
      return { x: col, y: row };
    }
    
    return { x: 0, y: 0 };
  }
}
