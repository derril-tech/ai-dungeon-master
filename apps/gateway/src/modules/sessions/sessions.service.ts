import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './session.entity';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
  ) {}

  async create(createSessionDto: CreateSessionDto, orgId: string): Promise<Session> {
    const session = this.sessionsRepository.create({
      ...createSessionDto,
      status: 'created',
    });
    return this.sessionsRepository.save(session);
  }

  async findByCampaign(campaignId: string, orgId: string): Promise<Session[]> {
    return this.sessionsRepository.find({
      where: { campaignId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, orgId: string): Promise<Session> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    return session;
  }

  async start(id: string, orgId: string): Promise<Session> {
    const session = await this.findOne(id, orgId);
    if (session.status !== 'created' && session.status !== 'paused') {
      throw new BadRequestException('Session can only be started from created or paused state');
    }
    session.status = 'staging';
    session.startedAt = new Date();
    return this.sessionsRepository.save(session);
  }

  async pause(id: string, orgId: string): Promise<Session> {
    const session = await this.findOne(id, orgId);
    if (session.status === 'completed' || session.status === 'failed') {
      throw new BadRequestException('Cannot pause completed or failed session');
    }
    session.status = 'paused';
    return this.sessionsRepository.save(session);
  }

  async resume(id: string, orgId: string): Promise<Session> {
    const session = await this.findOne(id, orgId);
    if (session.status !== 'paused') {
      throw new BadRequestException('Session can only be resumed from paused state');
    }
    session.status = 'exploring';
    return this.sessionsRepository.save(session);
  }

  async end(id: string, orgId: string): Promise<Session> {
    const session = await this.findOne(id, orgId);
    session.status = 'completed';
    session.endedAt = new Date();
    return this.sessionsRepository.save(session);
  }
}
