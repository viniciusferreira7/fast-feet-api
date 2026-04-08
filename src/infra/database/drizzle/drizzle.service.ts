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
      host: 'localhost',
      port: Number(this.envService.get('DATABASE_PORT') ?? 0),
      user: this.envService.get('DATABASE_USERNAME'),
      password: this.envService.get('DATABASE_PASSWORD'),
      database: this.envService.get('DATABASE_NAME'),
    });

    this.db = drizzle(this.pool);
  }
  async onModuleDestroy() {
    await this.pool.end();
  }
}
