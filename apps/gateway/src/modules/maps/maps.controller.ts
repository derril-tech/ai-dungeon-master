import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MapsService } from './maps.service';
import { CreateMapDto } from './dto/create-map.dto';
import { CreateTokenDto } from './dto/create-token.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('maps')
@Controller('maps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new map' })
  @ApiResponse({ status: 201, description: 'Map created successfully' })
  async createMap(@Body() createMapDto: CreateMapDto) {
    return await this.mapsService.createMap(createMapDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get map details' })
  @ApiResponse({ status: 200, description: 'Map details' })
  async getMap(@Param('id') id: string) {
    return await this.mapsService.getMap(id);
  }

  @Get('campaign/:campaignId')
  @ApiOperation({ summary: 'Get maps by campaign' })
  @ApiResponse({ status: 200, description: 'List of maps' })
  async getMapsByCampaign(@Param('campaignId') campaignId: string) {
    return await this.mapsService.getMapsByCampaign(campaignId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update map' })
  @ApiResponse({ status: 200, description: 'Map updated successfully' })
  async updateMap(@Param('id') id: string, @Body() updateData: any) {
    return await this.mapsService.updateMap(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete map' })
  @ApiResponse({ status: 200, description: 'Map deleted successfully' })
  async deleteMap(@Param('id') id: string) {
    await this.mapsService.deleteMap(id);
    return { message: 'Map deleted successfully' };
  }

  @Post('tokens')
  @ApiOperation({ summary: 'Create a new token' })
  @ApiResponse({ status: 201, description: 'Token created successfully' })
  async createToken(@Body() createTokenDto: CreateTokenDto) {
    return await this.mapsService.createToken(createTokenDto);
  }

  @Get('tokens/:id')
  @ApiOperation({ summary: 'Get token details' })
  @ApiResponse({ status: 200, description: 'Token details' })
  async getToken(@Param('id') id: string) {
    return await this.mapsService.getToken(id);
  }

  @Get('maps/:mapId/tokens')
  @ApiOperation({ summary: 'Get tokens by map' })
  @ApiResponse({ status: 200, description: 'List of tokens' })
  async getTokensByMap(@Param('mapId') mapId: string) {
    return await this.mapsService.getTokensByMap(mapId);
  }

  @Put('tokens/:id')
  @ApiOperation({ summary: 'Update token' })
  @ApiResponse({ status: 200, description: 'Token updated successfully' })
  async updateToken(@Param('id') id: string, @Body() updateData: any) {
    return await this.mapsService.updateToken(id, updateData);
  }

  @Put('tokens/:id/move')
  @ApiOperation({ summary: 'Move token to new position' })
  @ApiResponse({ status: 200, description: 'Token moved successfully' })
  async moveToken(
    @Param('id') id: string,
    @Body() body: { x: number; y: number }
  ) {
    return await this.mapsService.moveToken(id, body.x, body.y);
  }

  @Delete('tokens/:id')
  @ApiOperation({ summary: 'Delete token' })
  @ApiResponse({ status: 200, description: 'Token deleted successfully' })
  async deleteToken(@Param('id') id: string) {
    await this.mapsService.deleteToken(id);
    return { message: 'Token deleted successfully' };
  }

  @Get('maps/:mapId/distance')
  @ApiOperation({ summary: 'Calculate distance between two points' })
  @ApiResponse({ status: 200, description: 'Distance calculation result' })
  async calculateDistance(
    @Param('mapId') mapId: string,
    @Query('x1') x1: number,
    @Query('y1') y1: number,
    @Query('x2') x2: number,
    @Query('y2') y2: number
  ) {
    return await this.mapsService.calculateDistance(mapId, x1, y1, x2, y2);
  }

  @Get('maps/:mapId/line-of-sight')
  @ApiOperation({ summary: 'Calculate line of sight between two points' })
  @ApiResponse({ status: 200, description: 'Line of sight calculation result' })
  async calculateLineOfSight(
    @Param('mapId') mapId: string,
    @Query('startX') startX: number,
    @Query('startY') startY: number,
    @Query('endX') endX: number,
    @Query('endY') endY: number
  ) {
    return await this.mapsService.calculateLineOfSight(mapId, startX, startY, endX, endY);
  }

  @Get('maps/:mapId/export')
  @ApiOperation({ summary: 'Export map data' })
  @ApiResponse({ status: 200, description: 'Map export result' })
  async exportMap(
    @Param('mapId') mapId: string,
    @Query('format') format: string = 'json'
  ) {
    return await this.mapsService.exportMap(mapId, format);
  }
}
