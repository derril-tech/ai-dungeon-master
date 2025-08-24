import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  async create(@Body() createSessionDto: CreateSessionDto, @Request() req) {
    return this.sessionsService.create(createSessionDto, req.user.orgId);
  }

  @Get('campaign/:campaignId')
  @ApiOperation({ summary: 'Get all sessions for a campaign' })
  @ApiResponse({ status: 200, description: 'List of sessions' })
  async findByCampaign(@Param('campaignId') campaignId: string, @Request() req) {
    return this.sessionsService.findByCampaign(campaignId, req.user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  @ApiResponse({ status: 200, description: 'Session details' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.sessionsService.findOne(id, req.user.orgId);
  }

  @Put(':id/start')
  @ApiOperation({ summary: 'Start a session' })
  @ApiResponse({ status: 200, description: 'Session started successfully' })
  async start(@Param('id') id: string, @Request() req) {
    return this.sessionsService.start(id, req.user.orgId);
  }

  @Put(':id/pause')
  @ApiOperation({ summary: 'Pause a session' })
  @ApiResponse({ status: 200, description: 'Session paused successfully' })
  async pause(@Param('id') id: string, @Request() req) {
    return this.sessionsService.pause(id, req.user.orgId);
  }

  @Put(':id/resume')
  @ApiOperation({ summary: 'Resume a session' })
  @ApiResponse({ status: 200, description: 'Session resumed successfully' })
  async resume(@Param('id') id: string, @Request() req) {
    return this.sessionsService.resume(id, req.user.orgId);
  }

  @Put(':id/end')
  @ApiOperation({ summary: 'End a session' })
  @ApiResponse({ status: 200, description: 'Session ended successfully' })
  async end(@Param('id') id: string, @Request() req) {
    return this.sessionsService.end(id, req.user.orgId);
  }
}
