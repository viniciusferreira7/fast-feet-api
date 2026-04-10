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
    console.log(service);
    expect(service.db).toBeDefined();
  });

  it('should successfully execute a query against the database', async () => {
    const result = await service.db.execute(sql`SELECT 1 AS value`);

    expect(result.rows[0]).toEqual({ value: 1 });
  });

  afterEach(async () => {
    await app.close();
  });
});
