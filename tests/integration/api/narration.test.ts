// Created automatically by Cursor AI (2024-12-19)

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../../../../apps/gateway/src/app.module';
import { AuthService } from '../../../../apps/gateway/src/modules/auth/auth.service';
import { User } from '../../../../apps/gateway/src/modules/auth/user.entity';
import { Session } from '../../../../apps/gateway/src/modules/sessions/session.entity';
import { Campaign } from '../../../../apps/gateway/src/modules/campaigns/campaign.entity';

describe('Narration API Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let testUser: User;
  let testCampaign: Campaign;
  let testSession: Session;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.TEST_DB_HOST || 'localhost',
          port: parseInt(process.env.TEST_DB_PORT) || 5432,
          username: process.env.TEST_DB_USER || 'test',
          password: process.env.TEST_DB_PASSWORD || 'test',
          database: process.env.TEST_DB_NAME || 'ai_dungeon_master_test',
          entities: [User, Session, Campaign],
          synchronize: true,
          logging: false,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    authService = moduleRef.get<AuthService>(AuthService);
  });

  beforeEach(async () => {
    // Create test user
    testUser = await authService.createUser({
      email: 'test@example.com',
      password: 'testpassword',
      username: 'testuser',
    });

    // Login and get token
    const loginResult = await authService.login({
      email: 'test@example.com',
      password: 'testpassword',
    });
    authToken = loginResult.access_token;

    // Create test campaign
    const campaignRepository = app.get('CampaignRepository');
    testCampaign = await campaignRepository.save({
      name: 'Test Campaign',
      description: 'Test campaign for integration tests',
      owner: testUser,
      settings: {
        theme: 'fantasy',
        rating: 'general',
      },
    });

    // Create test session
    const sessionRepository = app.get('SessionRepository');
    testSession = await sessionRepository.save({
      campaign: testCampaign,
      name: 'Test Session',
      status: 'active',
      current_state: {
        location: 'tavern',
        time_of_day: 'evening',
        weather: 'clear',
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/narration/generate', () => {
    it('should generate narration for valid request', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/narration/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: testSession.id,
          prompt: 'What do I see in the tavern?',
          context: {
            location: 'tavern',
            time_of_day: 'evening',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('narration');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.narration).toBeTruthy();
    });

    it('should return 400 for missing sessionId', async () => {
      await request(app.getHttpServer())
        .post('/api/narration/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'What do I see?',
          context: {},
        })
        .expect(400);
    });

    it('should return 400 for missing prompt', async () => {
      await request(app.getHttpServer())
        .post('/api/narration/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: testSession.id,
          context: {},
        })
        .expect(400);
    });

    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/narration/generate')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          sessionId: testSession.id,
          prompt: 'What do I see?',
          context: {},
        })
        .expect(401);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app.getHttpServer())
        .post('/api/narration/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: 'non-existent-id',
          prompt: 'What do I see?',
          context: {},
        })
        .expect(404);
    });
  });

  describe('GET /api/narration/history/:sessionId', () => {
    beforeEach(async () => {
      // Create some test narration history
      const narrationRepository = app.get('NarrationRepository');
      await narrationRepository.save([
        {
          session: testSession,
          content: 'The tavern is dimly lit...',
          type: 'narration',
          timestamp: new Date('2024-01-01T10:00:00Z'),
        },
        {
          session: testSession,
          content: 'You see a mysterious figure...',
          type: 'narration',
          timestamp: new Date('2024-01-01T10:05:00Z'),
        },
      ]);
    });

    it('should return narration history for valid session', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/narration/history/${testSession.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('timestamp');
      expect(response.body[0]).toHaveProperty('type');
    });

    it('should return 401 for invalid token', async () => {
      await request(app.getHttpServer())
        .get(`/api/narration/history/${testSession.id}`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app.getHttpServer())
        .get('/api/narration/history/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/narration/history/${testSession.id}?page=1&limit=1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('POST /api/narration/stream', () => {
    it('should stream narration generation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/narration/stream')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'text/event-stream')
        .send({
          sessionId: testSession.id,
          prompt: 'Describe the tavern in detail',
          context: {
            location: 'tavern',
            time_of_day: 'evening',
          },
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.text).toContain('data:');
    });

    it('should handle streaming errors gracefully', async () => {
      await request(app.getHttpServer())
        .post('/api/narration/stream')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'text/event-stream')
        .send({
          sessionId: 'non-existent-id',
          prompt: 'What do I see?',
          context: {},
        })
        .expect(404);
    });
  });

  describe('POST /api/narration/safety-check', () => {
    it('should check content safety', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/narration/safety-check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'The tavern is peaceful and welcoming.',
          contentType: 'narration',
          context: {
            campaign_rating: 'general',
            theme: 'fantasy',
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty('level');
      expect(response.body).toHaveProperty('reason');
      expect(response.body).toHaveProperty('moderated_content');
    });

    it('should flag inappropriate content', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/narration/safety-check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This contains inappropriate content that should be flagged.',
          contentType: 'narration',
          context: {
            campaign_rating: 'general',
            theme: 'fantasy',
          },
        })
        .expect(200);

      expect(['warning', 'blocked', 'review']).toContain(response.body.level);
    });
  });
});
