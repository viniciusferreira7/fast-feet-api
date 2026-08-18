import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { log } from '@/infra/logger';

export const DATABASE_CHECK_TIMEOUT_MS = 2000;

export type DatabaseHealth = {
  status: 'up' | 'down';
  responseTime: number;
};

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`Database check timed out after ${ms}ms`)),
        ms
      );
    }),
  ]).finally(() => clearTimeout(timer));
}

@Injectable()
export class DatabaseHealthIndicator {
  constructor(private readonly drizzleService: DrizzleService) {}

  async check(): Promise<DatabaseHealth> {
    const startedAt = Date.now();

    try {
      await withTimeout(
        this.drizzleService.db.execute(sql`select 1`),
        DATABASE_CHECK_TIMEOUT_MS
      );

      return { status: 'up', responseTime: Date.now() - startedAt };
    } catch (err) {
      log.error({ err }, '[Health] database check failed');

      return { status: 'down', responseTime: Date.now() - startedAt };
    }
  }
}
