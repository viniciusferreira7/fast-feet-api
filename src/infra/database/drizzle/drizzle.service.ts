import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class DrizzleService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  public db!: NodePgDatabase;
  constructor(private readonly envService: EnvService) {}

  onModuleInit() {
    this.pool = new Pool({
      connectionString: this.envService.get('DATABASE_URL'),
    });

    this.db = drizzle(this.pool);
  }
  async onModuleDestroy() {
    await this.pool.end();
  }
}
