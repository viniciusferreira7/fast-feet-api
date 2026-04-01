import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '@/infra/app.module';
import { CryptographyModule } from '@/infra/cryptography/cryptography.module';
import { EmailModule } from '@/infra/email/email.module';
import { EnvModule } from '@/infra/env/env.module';

export async function makeModuleRef(): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule, CryptographyModule, EmailModule, EnvModule],
    providers: [],
  }).compile();

  return moduleRef;
}
