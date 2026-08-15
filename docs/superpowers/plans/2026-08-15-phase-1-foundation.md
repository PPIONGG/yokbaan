# YokBaan เฟส 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างโครง monorepo ที่รันได้จริง — NestJS ต่อ PostgreSQL ได้ React แสดงผลจาก API ได้ และมีเทสอัตโนมัติพิสูจน์ว่าทั้งเส้นเชื่อมกันจริง

**Architecture:** npm workspaces monorepo แยก `apps/api` (NestJS) กับ `apps/web` (React + Vite) โดยมี `packages/shared` เก็บ zod schema ที่ทั้งสองฝั่งใช้ร่วมกัน PostgreSQL รันใน Docker

**Tech Stack:** Node 24, TypeScript 5.7, NestJS 11, Prisma 6, PostgreSQL 17, React 19, Vite 6, Tailwind 4, Jest + supertest (api), Vitest (web), zod 3

**Spec:** [`../specs/2026-08-15-yokbaan-design.md`](../specs/2026-08-15-yokbaan-design.md)

## Global Constraints

- Node `>=24` — ประกาศใน `engines` ของ root package.json
- ทุก workspace ใช้ TypeScript `strict: true` ห้ามปิด
- ชื่อ package ใช้ scope `@yokbaan/*`
- PostgreSQL รันที่ **port 5434** บนเครื่อง (เลี่ยงชนกับ duebook ที่ใช้ 5433)
- **ห้าม commit `.env`** — commit `.env.example` แทน
- เงินทุกที่ในระบบเป็น `Int` หน่วยสตางค์ ชื่อฟิลด์ลงท้าย `Satang` (ยังไม่ใช้ในเฟสนี้ แต่ตั้งกฎไว้ก่อน)
- ฝั่ง web เรียก API ผ่าน `src/api/` เท่านั้น ห้าม `fetch` ในคอมโพเนนต์
- 1 task = 1 commit

---

### Task 1.1: โครง monorepo และ git

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.env.example`

**Interfaces:**
- Consumes: —
- Produces: npm workspaces ที่ชี้ไป `apps/*` และ `packages/*` · `tsconfig.base.json` ที่ทุก workspace `extends`

- [x] **Step 1: สร้าง git repository**

```bash
cd ~/Desktop/GitHub/yokbaan
git init
git branch -M main
```

- [x] **Step 2: สร้าง `.gitignore`**

```gitignore
node_modules/
dist/
build/
coverage/
*.tsbuildinfo
.env
.env.local
.DS_Store
.superpowers/
```

- [x] **Step 3: สร้าง root `package.json`**

```json
{
  "name": "yokbaan",
  "version": "0.0.0",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "engines": { "node": ">=24" },
  "scripts": {
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "api:dev": "npm run start:dev -w @yokbaan/api",
    "api:test": "npm run test:e2e -w @yokbaan/api",
    "web:dev": "npm run dev -w @yokbaan/web",
    "web:test": "npm run test -w @yokbaan/web"
  }
}
```

- [x] **Step 4: สร้าง `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true
  }
}
```

- [x] **Step 5: สร้าง `.env.example`**

```bash
# PostgreSQL (รันด้วย docker compose up -d)
DATABASE_URL="postgresql://yokbaan:yokbaan@localhost:5434/yokbaan?schema=public"

# ฐานข้อมูลสำหรับรันเทส — คนละฐานกับข้างบน เทสจะได้ไม่ลบข้อมูลที่เราใช้ทดลอง
DATABASE_URL_TEST="postgresql://yokbaan:yokbaan@localhost:5434/yokbaan_test?schema=public"

# API
API_PORT=3000
WEB_ORIGIN=http://localhost:5173
```

- [x] **Step 6: คัดลอกเป็น `.env` จริง และตรวจว่า git ไม่เห็นมัน**

```bash
cp .env.example .env
git status --short
```

Expected: ไม่มีบรรทัด `.env` (มีแต่ `.env.example`) — ถ้าเห็น `.env` แปลว่า `.gitignore` ผิด

- [x] **Step 7: Commit**

```bash
git add .gitignore package.json tsconfig.base.json .env.example CONTEXT.md docs/
git commit -m "chore: initialise yokbaan monorepo skeleton"
```

---

### Task 1.2: PostgreSQL ใน Docker

**Files:**
- Create: `docker-compose.yml`
- Create: `docker/postgres-init/01-create-test-database.sql`

**Interfaces:**
- Consumes: `DATABASE_URL` และ `DATABASE_URL_TEST` จาก `.env` (Task 1.1)
- Produces: PostgreSQL 17 ที่ `localhost:5434` มี 2 ฐานข้อมูล — `yokbaan` (ใช้ทดลอง) และ `yokbaan_test` (ให้เทสใช้) user/password เป็น `yokbaan` ทั้งคู่

- [x] **Step 1: สร้าง `docker/postgres-init/01-create-test-database.sql`**

```sql
CREATE DATABASE yokbaan_test;
```

> **ทำไมต้องมีฐานข้อมูลที่สอง** — เทสต้องล้างข้อมูลก่อนรันทุกครั้งเพื่อให้ผลลัพธ์แน่นอน
> ถ้าใช้ฐานเดียวกับที่เราเปิดเว็บเล่น ข้อมูลสินค้าที่เพิ่งกรอกจะหายทุกครั้งที่รันเทส
> ไฟล์ในโฟลเดอร์ `/docker-entrypoint-initdb.d` จะถูก Postgres รันอัตโนมัติ **ครั้งแรกที่สร้าง volume เท่านั้น**

- [x] **Step 2: สร้าง `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: yokbaan-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: yokbaan
      POSTGRES_PASSWORD: yokbaan
      POSTGRES_DB: yokbaan
    ports:
      - "5434:5432"
    volumes:
      - yokbaan-pgdata:/var/lib/postgresql/data
      - ./docker/postgres-init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U yokbaan -d yokbaan"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  yokbaan-pgdata:
```

- [x] **Step 3: เปิดฐานข้อมูล**

Run: `npm run db:up`

- [x] **Step 4: ตรวจว่าฐานข้อมูลพร้อมใช้จริง**

Run: `docker exec yokbaan-postgres pg_isready -U yokbaan -d yokbaan`

Expected: `/var/run/postgresql:5432 - accepting connections`

ถ้าได้ `no response` ให้รอ 5 วินาทีแล้วรันซ้ำ — ครั้งแรกฐานข้อมูลต้องสร้างไฟล์ก่อน

- [x] **Step 5: ตรวจว่าฐานข้อมูลเทสถูกสร้างแล้ว**

Run: `docker exec yokbaan-postgres psql -U yokbaan -lqt | cut -d '|' -f 1 | tr -d ' '`

Expected: มีทั้ง `yokbaan` และ `yokbaan_test` ในรายการ

> ถ้าไม่เห็น `yokbaan_test` แปลว่า volume ถูกสร้างไปก่อนที่จะมีไฟล์ SQL — ลบแล้วสร้างใหม่ด้วย
> `docker compose down -v && npm run db:up`
> (`-v` ลบข้อมูลทั้งหมดในฐานข้อมูล ตอนนี้ยังไม่มีอะไรจึงปลอดภัย แต่อย่าใช้คำสั่งนี้หลังจากมีข้อมูลจริงแล้ว)

- [x] **Step 6: Commit**

```bash
git add docker-compose.yml docker/
git commit -m "chore: add postgres 17 with separate test database"
```

---

### Task 1.3: NestJS พร้อม health endpoint

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/nest-cli.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/test/jest-e2e.json`
- Test: `apps/api/test/health.e2e-spec.ts`

**Interfaces:**
- Consumes: `tsconfig.base.json` (Task 1.1)
- Produces: `AppModule` (`apps/api/src/app.module.ts`) — module ราก ทุก module รุ่นหลังจะถูก import ที่นี่ · `GET /health` → `200 { status: 'ok' }`

- [x] **Step 1: สร้าง `apps/api/package.json`**

```json
{
  "name": "@yokbaan/api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start:dev": "nest start --watch",
    "test:e2e": "jest --config test/jest-e2e.json --runInBand"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^24.0.0",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.7.0"
  }
}
```

- [x] **Step 2: สร้าง `apps/api/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "strictPropertyInitialization": false
  },
  "include": ["src/**/*", "test/**/*"]
}
```

> `strictPropertyInitialization: false` จำเป็นเพราะ NestJS ใช้ dependency injection ผ่าน constructor และ decorator — property ถูกเซ็ตโดย framework ไม่ใช่โดยเรา

- [x] **Step 3: สร้าง `apps/api/nest-cli.json`**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
```

- [x] **Step 4: สร้าง `apps/api/test/jest-e2e.json`**

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" }
}
```

- [x] **Step 5: ติดตั้ง dependencies**

Run: `npm install` (จาก root — npm workspaces จะติดตั้งให้ทุก workspace)

- [x] **Step 6: เขียนเทสที่จะ fail**

สร้าง `apps/api/test/health.e2e-spec.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

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

  it('GET /health returns status ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

- [x] **Step 7: รันเทสให้เห็นว่ามัน fail**

Run: `npm run api:test`

Expected: FAIL — `Cannot find module '../src/app.module'`

> **ทำไมต้องรันให้ fail ก่อน** — เพื่อพิสูจน์ว่าเทสตัวนี้ทำงานจริงและกำลังทดสอบสิ่งที่เราคิด เทสที่ผ่านตั้งแต่ยังไม่มีโค้ดคือเทสที่ไม่ได้ทดสอบอะไรเลย

- [x] **Step 8: เขียนโค้ดน้อยที่สุดให้ผ่าน**

สร้าง `apps/api/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
```

สร้าง `apps/api/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';

@Module({
  controllers: [HealthController],
})
export class AppModule {}
```

สร้าง `apps/api/src/main.ts`:

```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);
  console.log(`API listening on http://localhost:${port}`);
}

void bootstrap();
```

- [x] **Step 9: รันเทสให้ผ่าน**

Run: `npm run api:test`

Expected: PASS — `Health (e2e) › GET /health returns status ok`

- [x] **Step 10: Commit**

```bash
git add apps/api
git commit -m "feat(api): add nestjs app with health endpoint"
```

---

### Task 1.4: เชื่อม Prisma กับ PostgreSQL

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Modify: `apps/api/src/health/health.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/package.json`
- Test: `apps/api/test/health.e2e-spec.ts`

**Interfaces:**
- Consumes: `AppModule` (Task 1.3) · PostgreSQL ที่ port 5434 (Task 1.2)
- Produces: `PrismaService extends PrismaClient` (`apps/api/src/prisma/prisma.service.ts`) — inject ตัวนี้ทุกครั้งที่ต้องคุยกับฐานข้อมูล · `PrismaModule` ที่ประกาศ `@Global()` จึงไม่ต้อง import ซ้ำในทุก module · `GET /health/db` → `200 { database: 'connected' }`

- [x] **Step 1: เพิ่ม dependency ของ Prisma**

Run: `npm install prisma@^6 @prisma/client@^6 dotenv@^16 -w @yokbaan/api`

- [x] **Step 2: เพิ่ม script ของ Prisma ใน `apps/api/package.json`**

เพิ่มใน `"scripts"`:

```json
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
```

- [x] **Step 3: สร้าง `apps/api/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

> ยังไม่มี model — เฟสนี้แค่พิสูจน์ว่าต่อฐานข้อมูลได้ model แรก (`User`) จะมาใน Task 2.1

- [x] **Step 4: ให้ Prisma อ่าน `.env` จาก root ได้**

สร้าง `apps/api/.env` เป็น symlink ไปหาไฟล์ที่ root:

```bash
ln -s ../../.env apps/api/.env
```

ตรวจว่า `.env` ทั้งสองที่ถูก git ignore:

```bash
git status --short apps/api
```

Expected: ไม่มีบรรทัดไหนเอ่ยถึง `.env`

- [x] **Step 5: สร้าง Prisma client**

Run: `npm run prisma:generate -w @yokbaan/api`

Expected: `Generated Prisma Client (v6.x.x)`

- [x] **Step 6: เขียนเทสที่จะ fail**

เพิ่ม test case ใน `apps/api/test/health.e2e-spec.ts` ต่อจาก case เดิม:

```ts
  it('GET /health/db reports the database is reachable', async () => {
    const res = await request(app.getHttpServer()).get('/health/db').expect(200);
    expect(res.body).toEqual({ database: 'connected' });
  });
```

- [x] **Step 7: รันเทสให้เห็นว่า fail**

Run: `npm run api:test`

Expected: case แรกยัง PASS · case ใหม่ FAIL ด้วย 404

- [x] **Step 8: สร้าง `apps/api/src/prisma/prisma.service.ts`**

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
```

- [x] **Step 9: สร้าง `apps/api/src/prisma/prisma.module.ts`**

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [x] **Step 10: แก้ `apps/api/src/health/health.controller.ts`**

```ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('db')
  async checkDatabase(): Promise<{ database: 'connected' }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { database: 'connected' };
  }
}
```

- [x] **Step 11: แก้ `apps/api/src/app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class AppModule {}
```

- [x] **Step 12: โหลด `.env` ตอน bootstrap — แก้ `apps/api/src/main.ts`**

เพิ่มสองบรรทัดบนสุด **ก่อน** import อื่นทั้งหมด:

```ts
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();
```

- [x] **Step 13: ให้เทสใช้ฐานข้อมูลเทส ไม่ใช่ฐานข้อมูลที่เราเล่น**

สร้าง `apps/api/test/setup-env.ts`:

```ts
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const testUrl = process.env.DATABASE_URL_TEST;

if (!testUrl) {
  throw new Error(
    'DATABASE_URL_TEST is not set. Copy .env.example to .env before running tests.',
  );
}

process.env.DATABASE_URL = testUrl;
```

> **ทำไมต้อง throw ถ้าไม่มีค่า** — ถ้าปล่อยให้ตกกลับไปใช้ `DATABASE_URL` เงียบๆ
> วันหนึ่งที่ลืมตั้งค่า เทสจะไปลบข้อมูลจริงโดยไม่มีใครรู้ **ล้มดังๆ ดีกว่าพังเงียบๆ**

แก้ `apps/api/test/jest-e2e.json` เพิ่มบรรทัด `setupFiles`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "setupFiles": ["<rootDir>/test/setup-env.ts"]
}
```

- [x] **Step 14: รันเทสให้ผ่าน**

ตรวจก่อนว่าฐานข้อมูลเปิดอยู่: `npm run db:up`

Run: `npm run api:test`

Expected: PASS ทั้ง 2 cases

> ถ้าได้ `Can't reach database server at localhost:5434` แปลว่า Docker ยังไม่ขึ้น — รัน `npm run db:up` แล้วรอ 5 วินาที

- [x] **Step 15: Commit**

```bash
git add apps/api
git commit -m "feat(api): connect prisma to postgres with db health check"
```

---

### Task 1.5: packages/shared — type ที่ใช้ร่วมสองฝั่ง

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/health.ts`
- Modify: `apps/api/package.json`
- Test: `apps/api/test/health.e2e-spec.ts`

**Interfaces:**
- Consumes: `tsconfig.base.json` (Task 1.1) · `GET /health` (Task 1.3)
- Produces: `@yokbaan/shared` export `healthResponseSchema` (zod) และ type `HealthResponse` — ทั้ง `apps/api` และ `apps/web` import จากที่นี่

- [x] **Step 1: สร้าง `packages/shared/package.json`**

```json
{
  "name": "@yokbaan/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

> ชี้ `main` ไปที่ `.ts` ตรงๆ ได้เพราะทั้ง ts-jest และ Vite คอมไพล์ TypeScript ให้อยู่แล้ว ไม่ต้องมีขั้น build แยก — ลดความยุ่งยากลงหนึ่งชั้น

- [x] **Step 2: สร้าง `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "noEmit": true
  },
  "include": ["src/**/*"]
}
```

- [x] **Step 3: สร้าง `packages/shared/src/health.ts`**

```ts
import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
```

- [x] **Step 4: สร้าง `packages/shared/src/index.ts`**

```ts
export * from './health';
```

- [x] **Step 5: ให้ api ใช้ shared ได้**

Run: `npm install @yokbaan/shared@* -w @yokbaan/api`

ตรวจว่า `apps/api/package.json` มี `"@yokbaan/shared": "*"` ใน `dependencies`

- [x] **Step 6: เขียนเทสที่จะ fail — แก้ case แรกใน `apps/api/test/health.e2e-spec.ts`**

เพิ่ม import บนสุด:

```ts
import { healthResponseSchema } from '@yokbaan/shared';
```

แทนที่ case แรกด้วย:

```ts
  it('GET /health matches the shared schema', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    const parsed = healthResponseSchema.safeParse(res.body);
    expect(parsed.success).toBe(true);
  });
```

- [x] **Step 7: รันเทส**

Run: `npm run api:test`

Expected: **PASS ทั้ง 2 cases**

> **แผนฉบับแรกเขียนไว้ผิด** — คาดว่าขั้นนี้จะ fail ด้วย `Cannot find module '@yokbaan/shared'`
> แล้วต้องไปเพิ่ม `moduleNameMapper` ใน jest config เพื่อแก้ ความจริงคือ **ไม่ต้องแก้อะไรเลย**
>
> npm workspaces สร้าง symlink `node_modules/@yokbaan/shared → ../../packages/shared` ให้ตั้งแต่ตอน
> `npm install` และ jest คลี่ symlink เป็น path จริงก่อนโหลดไฟล์ ทำให้ `packages/shared/src/index.ts`
> ถูกมองว่าอยู่นอก `node_modules` จึงผ่าน ts-jest ตามปกติ การหยิบ `moduleNameMapper` มาใส่จะเป็น
> **config ที่ไม่ได้ทำอะไร** และแย่กว่านั้นคือมันจะ hardcode path ทับการ resolve ของจริง — วันที่
> `packages/shared/package.json` เปลี่ยน `main` ฝั่งเทสจะยังชี้ path เก่าอยู่ ขณะที่ฝั่งเว็บย้ายตาม
> กลายเป็นความต่างระหว่างสองฝั่ง ซึ่งคือสิ่งที่ package นี้เกิดมาเพื่อป้องกันพอดี

- [x] **Step 8: พิสูจน์ว่า schema กลาง "มีฟัน" จริง**

นี่คือขั้นแดงตัวจริงของ task นี้ — เทสที่ผ่านเฉยๆ ยังไม่ได้พิสูจน์ว่า schema บังคับอะไร

แก้ `apps/api/src/health/health.controller.ts` ชั่วคราว ให้ `check()` คืนค่าคนละรูป เช่นเปลี่ยน
ทั้ง return type และค่าที่คืนเป็น `{ status: 'fine' }` แล้วรัน:

Run: `npm run api:test`

Expected: case `GET /health matches the shared schema` **FAIL** ส่วน case `/health/db` ยังผ่าน

> ถ้า TypeScript ปัดตกตั้งแต่ตอน compile ก็ถือว่าใช้ได้เหมือนกัน — บันทึก error นั้นไว้แทน
> เพราะมันพิสูจน์ว่า type จาก schema กลางกำลังคุมฝั่ง API อยู่จริง

- [x] **Step 9: คืนค่าเดิมแล้วยืนยัน**

```bash
git checkout -- apps/api/src/health/health.controller.ts
npm run api:test
```

Expected: PASS ทั้ง 2 cases

> **ทำไม task นี้ถึงคุ้ม** — ตอนนี้ `healthResponseSchema` เป็นเจ้าของนิยามรูปร่างข้อมูลแต่เพียงผู้เดียว
> ฝั่ง API ถูกเทสบังคับให้ตอบตามนั้น ฝั่งเว็บจะ import ตัวเดียวกันไปใช้ใน Task 1.6
> ใครแก้ข้างเดียวเมื่อไหร่ อีกข้างพังทันทีตอน build หรือตอนเทส ไม่ใช่ตอนลูกค้าเปิดเว็บ

- [x] **Step 10: Commit**

```bash
git add packages/shared apps/api
git commit -m "feat(shared): add zod-backed contract package shared by api and web"
```

---

### Task 1.6: React + Vite + Tailwind เรียก API ได้

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/index.css`
- Create: `apps/web/src/api/client.ts`
- Create: `apps/web/src/api/health.ts`
- Test: `apps/web/src/api/health.test.ts`

**Interfaces:**
- Consumes: `@yokbaan/shared` (Task 1.5) · `GET /health` (Task 1.3)
- Produces: `apiGet<T>(path, schema)` (`apps/web/src/api/client.ts`) — **ทุกการเรียก API ในโปรเจคต้องผ่านฟังก์ชันนี้** · `fetchHealth()` (`apps/web/src/api/health.ts`)

- [x] **Step 1: สร้าง `apps/web/package.json`**

```json
{
  "name": "@yokbaan/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "@yokbaan/shared": "*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [x] **Step 2: สร้าง `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "declaration": false,
    "types": ["vite/client"]
  },
  "include": ["src/**/*"]
}
```

- [x] **Step 3: สร้าง `apps/web/vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'node',
  },
});
```

> **proxy คืออะไร** — ตอน dev เว็บรันที่ port 5173 ส่วน API อยู่ 3000 เบราว์เซอร์จะบล็อกการเรียกข้าม port (CORS) การให้ Vite เป็นตัวกลางส่งต่อทำให้เบราว์เซอร์เห็นว่าทุกอย่างมาจาก 5173 เดียวกัน ปัญหาจึงหายไปตั้งแต่แรก

- [x] **Step 4: สร้าง `apps/web/index.html`**

```html
<!doctype html>
<html lang="th">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>YokBaan</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [x] **Step 5: ติดตั้ง dependencies**

Run: `npm install`

- [x] **Step 6: เขียนเทสที่จะ fail**

สร้าง `apps/web/src/api/health.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { fetchHealth } from './health';

describe('fetchHealth', () => {
  it('returns the parsed body when the API responds correctly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      }),
    );

    await expect(fetchHealth()).resolves.toEqual({ status: 'ok' });
  });

  it('throws when the API returns a shape the schema rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'broken' }),
      }),
    );

    await expect(fetchHealth()).rejects.toThrow('Invalid response from /health');
  });
});
```

- [x] **Step 7: รันเทสให้เห็นว่า fail**

Run: `npm run web:test`

Expected: FAIL — `Failed to resolve import "./health"`

- [x] **Step 8: สร้าง `apps/web/src/api/client.ts`**

```ts
import type { ZodSchema } from 'zod';

const BASE_URL = '/api';

export async function apiGet<T>(path: string, schema: ZodSchema<T>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }

  const parsed = schema.safeParse(await res.json());

  if (!parsed.success) {
    throw new Error(`Invalid response from ${path}`);
  }

  return parsed.data;
}
```

> `credentials: 'include'` ตั้งไว้ตั้งแต่ตอนนี้เพราะเฟส 2 จะใช้ session cookie — ถ้าไม่ใส่ เบราว์เซอร์จะไม่ส่ง cookie ไปกับ request แล้ว login จะไม่ทำงาน

- [x] **Step 9: สร้าง `apps/web/src/api/health.ts`**

```ts
import { healthResponseSchema, type HealthResponse } from '@yokbaan/shared';
import { apiGet } from './client';

export function fetchHealth(): Promise<HealthResponse> {
  return apiGet('/health', healthResponseSchema);
}
```

- [x] **Step 10: รันเทสให้ผ่าน**

Run: `npm run web:test`

Expected: PASS ทั้ง 2 cases

- [x] **Step 11: สร้างหน้าเว็บจริง — `apps/web/src/index.css`**

```css
@import "tailwindcss";
```

สร้าง `apps/web/src/App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { fetchHealth } from './api/health';

type Status = 'loading' | 'ok' | 'error';

export function App() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    fetchHealth()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">YokBaan</h1>
      <p className="text-sm text-gray-500">
        {status === 'loading' && 'กำลังเชื่อมต่อ API...'}
        {status === 'ok' && '✅ เชื่อมต่อ API สำเร็จ'}
        {status === 'error' && '❌ เชื่อมต่อ API ไม่ได้'}
      </p>
    </main>
  );
}
```

สร้าง `apps/web/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [x] **Step 12: ตรวจด้วยตาว่าทั้งเส้นทำงาน**

เปิด 3 terminal:

```bash
npm run db:up      # terminal 1 (รันครั้งเดียวจบ)
npm run api:dev    # terminal 2
npm run web:dev    # terminal 3
```

เปิด http://localhost:5173

Expected: เห็นหัวข้อ "YokBaan" และข้อความ **✅ เชื่อมต่อ API สำเร็จ**

> ถ้าเห็น ❌ ให้เปิด DevTools แท็บ Network ดูว่า `/api/health` ตอบอะไร — ถ้าได้ 404 แปลว่า API ยังไม่ขึ้น ถ้าได้ 500 แปลว่า API ขึ้นแต่พัง

- [x] **Step 13: ตรวจว่า TypeScript ไม่มี error**

Run: `npm run build -w @yokbaan/web`

Expected: build สำเร็จ ไม่มี type error

- [x] **Step 14: Commit**

```bash
git add apps/web
git commit -m "feat(web): add react + vite + tailwind app wired to the api"
```

---

### Task 1.7: เอกสารประจำเฟส

**Files:**
- Create: `README.md`
- Create: `docs/systems/README.md`
- Modify: `CONTEXT.md`

**Interfaces:**
- Consumes: ทุก task ก่อนหน้า
- Produces: `docs/systems/README.md` — template ที่ทุกเอกสารระบบในเฟสหลังต้องทำตาม

- [x] **Step 1: สร้าง `README.md` ที่ root**

````markdown
# YokBaan

เว็บ e-commerce ร้านเจ้าเดียว ขายของใช้ในบ้าน

## เริ่มต้นใช้งาน

```bash
cp .env.example .env
ln -s ../../.env apps/api/.env   # Prisma CLI อ่าน .env จากโฟลเดอร์ workspace ของตัวเอง
npm install
npm run db:up      # เปิด PostgreSQL ใน Docker
npm run api:dev    # http://localhost:3000
npm run web:dev    # http://localhost:5173
```

> บรรทัด `ln -s` จำเป็นเพราะ symlink ถูก git ignore (มันชี้ไป `.env` ที่ไม่เข้า git)
> คนที่ clone repo ไปใหม่ต้องสร้างเอง มิฉะนั้น `prisma migrate` จะหา `DATABASE_URL` ไม่เจอ

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run db:up` / `db:down` | เปิด/ปิด PostgreSQL |
| `npm run api:dev` | รัน API แบบ watch |
| `npm run web:dev` | รันเว็บแบบ watch |
| `npm run api:test` | รันเทส API (ต้องเปิด db ก่อน) |
| `npm run web:test` | รันเทสเว็บ |

## เอกสาร

- [สถานะโปรเจค](CONTEXT.md) — เปิดอันนี้ก่อนเสมอ
- [Design spec](docs/superpowers/specs/2026-08-15-yokbaan-design.md)
- [Roadmap](docs/superpowers/plans/2026-08-15-yokbaan-v1-roadmap.md)
- [เอกสารประจำระบบ](docs/systems/)
````

- [x] **Step 2: สร้าง `docs/systems/README.md`**

```markdown
# เอกสารประจำระบบ

แต่ละไฟล์ในโฟลเดอร์นี้อธิบายระบบหนึ่งระบบ อ่านแล้วต้องเข้าใจโดยไม่ต้องเปิดโค้ด

## ระบบทั้งหมด

| ไฟล์ | ระบบ | สถานะ |
|---|---|---|
| `auth.md` | สมาชิกและสิทธิ์ | ⬜ เฟส 2 |
| `catalog.md` | สินค้าและหมวดหมู่ | ⬜ เฟส 3 |
| `cart.md` | ตะกร้า | ⬜ เฟส 4 |
| `checkout.md` | สั่งซื้อและจองสต็อก | ⬜ เฟส 5 |
| `payment.md` | ชำระเงิน | ⬜ เฟส 6 |
| `orders.md` | ประวัติออเดอร์ | ⬜ เฟส 7 |
| `admin.md` | หลังร้าน | ⬜ เฟส 8 |
| `security.md` | ความปลอดภัยภาพรวม | ⬜ เฟส 9 |

## โครงที่ทุกไฟล์ต้องมี

1. **ระบบนี้ทำอะไร** — อธิบายให้คนไม่เคยเห็นโค้ดเข้าใจใน 3 ประโยค
2. **ทำไมออกแบบแบบนี้** — การตัดสินใจสำคัญ + ทางเลือกที่ไม่ได้เลือก + เหตุผล
3. **ไฟล์ที่เกี่ยวข้อง** — ตารางไฟล์ → หน้าที่
4. **Flow การทำงาน** — ลำดับเหตุการณ์ตั้งแต่ผู้ใช้กดจนจบ
5. **จุดที่พลาดง่าย** — แก้ตรงนี้แล้วต้องระวังอะไร
6. **วิธีทดสอบ** — คำสั่งรันเทส + เทสไหนพิสูจน์อะไร
```

- [x] **Step 3: อัปเดต `CONTEXT.md` — เปลี่ยนตาราง "ตอนนี้อยู่ตรงไหน"**

แทนที่แถว "เขียน implementation plan" และ "ลงมือเขียนโค้ด" ด้วย:

```markdown
| เขียน implementation plan | ✅ เสร็จ (roadmap + เฟส 1) |
| เฟส 1 — Foundation | ✅ เสร็จ |
| เฟส 2 — Auth | ⬅ **อยู่ตรงนี้** |
```

และลบบรรทัด "**ยังไม่มีโค้ดสักบรรทัด** — มีแต่เอกสาร" ออก

- [x] **Step 4: ตรวจว่าทุกเทสยังผ่าน**

```bash
npm run api:test && npm run web:test
```

Expected: PASS ทั้งหมด

- [x] **Step 5: Commit**

```bash
git add README.md docs/ CONTEXT.md
git commit -m "docs: add readme, systems doc template, update project status"
```

---

## เมื่อจบเฟส 1 คุณจะมี

- monorepo ที่ `npm install` ครั้งเดียวแล้วรันได้ทั้ง 3 ส่วน
- PostgreSQL ใน Docker ที่ API ต่อได้จริง (พิสูจน์ด้วยเทส ไม่ใช่ด้วยความรู้สึก)
- ฐานข้อมูลเทสแยกต่างหาก — รันเทสกี่ครั้งข้อมูลที่คุณกรอกเล่นก็ไม่หาย
- หน้าเว็บที่เรียก API ผ่าน `src/api/` ชั้นเดียวตามกฎ
- สัญญากลาง (`@yokbaan/shared`) ที่จะทำให้ api กับ web ไม่หลุดจากกัน
- เทสอัตโนมัติ 4 ตัว (api 2 + web 2)
- template เอกสารที่ทุกเฟสหลังจะทำตาม

**เฟสถัดไป:** ผมจะเขียน `2026-08-15-phase-2-auth.md` ให้ตอนคุณพร้อมเริ่มเฟส 2
