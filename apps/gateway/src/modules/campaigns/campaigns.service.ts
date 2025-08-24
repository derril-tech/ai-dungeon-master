import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './campaign.entity';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
  ) {}

  async create(createCampaignDto: CreateCampaignDto, orgId: string, createdBy: string): Promise<Campaign> {
    const campaign = this.campaignsRepository.create({
      ...createCampaignDto,
      orgId,
      createdBy,
    });
    return this.campaignsRepository.save(campaign);
  }

  async findAll(orgId: string): Promise<Campaign[]> {
    return this.campaignsRepository.find({
      where: { orgId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, orgId: string): Promise<Campaign> {
    const campaign = await this.campaignsRepository.findOne({
      where: { id, orgId },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign with ID ${id} not found`);
    }
    return campaign;
  }

  async update(id: string, updateCampaignDto: UpdateCampaignDto, orgId: string): Promise<Campaign> {
    const campaign = await this.findOne(id, orgId);
    Object.assign(campaign, updateCampaignDto);
    return this.campaignsRepository.save(campaign);
  }

  async remove(id: string, orgId: string): Promise<void> {
    const campaign = await this.findOne(id, orgId);
    await this.campaignsRepository.remove(campaign);
  }
}
