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
