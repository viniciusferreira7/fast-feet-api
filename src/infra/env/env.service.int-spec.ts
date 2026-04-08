import { makeModuleRef } from 'test/factories/make-module-ref';
import { EnvService } from './env.service';

let service: EnvService;

describe('EnvService', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    service = moduleRef.get<EnvService>(EnvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the NODE_ENV value', () => {
    const value = service.get('NODE_ENV');

    expect(value).toBe('test');
  });

  it('should return the PORT as a number', () => {
    const value = service.get('PORT');

    expect(typeof value).toBe('number');
  });

  it('should return the RESEND_API_KEY', () => {
    const value = service.get('RESEND_API_KEY');

    expect(value).toEqual(expect.any(String));
    expect(value.length).toBeGreaterThan(0);
  });

  it('should return the EMAIL', () => {
    const value = service.get('EMAIL');

    expect(value).toEqual(expect.any(String));
    expect(value.length).toBeGreaterThan(0);
  });

  it('should return the POSTAL_CODE_EXTERNAL_SERVICE_URL', () => {
    const value = service.get('POSTAL_CODE_EXTERNAL_SERVICE_URL');

    expect(value).toEqual(expect.any(String));
    expect(value.length).toBeGreaterThan(0);
  });
});
