import type { INestApplication } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { makeModuleRef } from 'test/factories/make-module-ref';
import { DrizzleService } from './drizzle.service';

let service: DrizzleService;
let app: INestApplication;

describe('DrizzleService', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = moduleRef.createNestApplication();
    service = moduleRef.get<DrizzleService>(DrizzleService);

    await app.init();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should expose a drizzle db instance after initialization', () => {
    expect(service.db).toBeDefined();
  });

  it('should successfully execute a query against the database', async () => {
    const result = await service.db.execute(sql`SELECT 1 AS value`);

    expect(result.rows[0]).toEqual({ value: 1 });
  });

  it('should query the isolated UUID schema', async () => {
    const result = await service.db.execute<{ current_schema: string }>(
      sql`SELECT current_schema()`
    );

    const schemaFromUrl = new URL(
      process.env.DATABASE_URL ?? ''
    ).searchParams.get('schema');
    expect(result.rows[0].current_schema).toBe(schemaFromUrl);
  });

  afterEach(async () => {
    await app.close();
  });
});
