import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/infra/database/database.module';
import { DatabaseHealthIndicator } from './database-health.indicator';
import { HealthController } from './health.controller';
import { ShutdownService } from './shutdown.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, ShutdownService],
  exports: [ShutdownService],
})
export class HealthModule {}
