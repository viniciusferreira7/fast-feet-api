import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { EnvService } from '@/infra/env/env.service';
import { log } from '@/infra/logger';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  public db!: NodePgDatabase;
  constructor(private readonly envService: EnvService) {}

  onModuleInit() {
    this.pool = new Pool({
      connectionString: this.envService.get('DATABASE_URL'),
    });

    this.pool.on('connect', () => {
      log.debug('[Drizzle] pool client connected');
    });

    this.pool.on('error', (err) => {
      log.error({ err }, '[Drizzle] pool error');
    });

    const isProd = this.envService.get('NODE_ENV') === 'production';

    this.db = drizzle(this.pool, {
      logger: {
        logQuery(query, params) {
          if (!isProd) {
            log.debug({ params }, query);
          }
        },
      },
    });
    log.info('[Drizzle] initialized');
  }
  async onModuleDestroy() {
    await this.pool.end();
    log.info('[Drizzle] pool closed');
  }
}
