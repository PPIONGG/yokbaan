import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { healthResponseSchema } from '@yokbaan/shared';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health matches the shared schema', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    const parsed = healthResponseSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
  });

  it('GET /health/db reports the database is reachable', async () => {
    const res = await request(app.getHttpServer()).get('/health/db').expect(200);
    expect(res.body).toEqual({ database: 'connected' });
  });
});
