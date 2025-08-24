import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async create(@Body() createCampaignDto: CreateCampaignDto, @Request() req) {
    return this.campaignsService.create(createCampaignDto, req.user.orgId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns for organization' })
  @ApiResponse({ status: 200, description: 'List of campaigns' })
  async findAll(@Request() req) {
    return this.campaignsService.findAll(req.user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign details' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.campaignsService.findOne(id, req.user.orgId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  async update(@Param('id') id: string, @Body() updateCampaignDto: UpdateCampaignDto, @Request() req) {
    return this.campaignsService.update(id, updateCampaignDto, req.user.orgId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.campaignsService.remove(id, req.user.orgId);
  }
}
