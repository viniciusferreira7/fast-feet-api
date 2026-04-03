import { Test, TestingModule } from '@nestjs/testing';
import { EnvModule } from '@/infra/env/env.module';
import { HttpModule } from '@/infra/http/http.module';
import { PostalCodeService } from './postal-code.service';

describe('PostalCodeService', () => {
  let service: PostalCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [EnvModule, HttpModule],
      providers: [PostalCodeService],
    }).compile();

    service = module.get<PostalCodeService>(PostalCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
