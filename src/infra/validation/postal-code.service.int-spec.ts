import { makeModuleRef } from 'test/factories/make-module-ref';
import { ExternalPostalCodeError } from '@/domain/delivery/errors/external-postal-code-validation-error';
import { PostalCodeService } from './postal-code.service';

let service: PostalCodeService;

describe('PostalCodeService', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    service = moduleRef.get<PostalCodeService>(PostalCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return right with valid postal code from external service', async () => {
    const result = await service.validate('69087-676');

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.postalCode).toBe('69087-676');
    }
  });

  it('should return left with ExternalPostalCodeError for an invalid postal code', async () => {
    const result = await service.validate('00000-000');

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ExternalPostalCodeError);
    }
  });
});
