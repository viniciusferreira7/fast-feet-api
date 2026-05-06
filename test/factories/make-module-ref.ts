import { Test, TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { EmailSender } from '@/domain/delivery/application/email/email-sender';
import { AppModule } from '@/infra/app.module';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { DrizzleService } from '@/infra/database/drizzle/drizzle.service';
import { EmailModule } from '@/infra/email/email.module';
import { EnvModule } from '@/infra/env/env.module';
import { HttpModule } from '@/infra/http/http.module';
import { ValidationModule } from '@/infra/validation/validation.module';
import { FakeEmailSender } from '../email/fake-email-sender';

export async function makeModuleRef(): Promise<TestingModule> {
  const databaseUrl = process.env.CI
    ? `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@localhost:5432/${process.env.DATABASE_NAME}`
    : (process.env.DATABASE_URL ?? '');

  const moduleRef = await Test.createTestingModule({
    imports: [
      AppModule,
      CryptographyModule,
      EmailModule,
      EnvModule,
      HttpModule,
      ValidationModule,
      DatabaseModule,
    ],
    providers: [],
  })
    // TODO: Replace FakeEmailSender with real implementation once Resend
    // domain/email verification is configured.
    .overrideProvider(EmailSender)
    .useClass(FakeEmailSender)
    .overrideProvider(DrizzleService)
    .useFactory({
      factory() {
        const pool = new Pool({ connectionString: databaseUrl });
        return {
          db: drizzle(pool),
          async onModuleDestroy() {
            await pool.end();
          },
        };
      },
    })
    .compile();

  return moduleRef;
}
