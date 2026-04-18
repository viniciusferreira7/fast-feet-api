import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/infra/app.module';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { DatabaseModule } from '@/infra/database/database.module';
import { EmailModule } from '@/infra/email/email.module';
import { EnvModule } from '@/infra/env/env.module';
import { HttpModule } from '@/infra/http/http.module';
import { ValidationModule } from '@/infra/validation/validation.module';

export async function makeModuleRef(): Promise<TestingModule> {
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
  }).compile();

  return moduleRef;
}
