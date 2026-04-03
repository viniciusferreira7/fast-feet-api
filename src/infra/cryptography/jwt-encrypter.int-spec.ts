import { JwtService } from '@nestjs/jwt';
import { makeModuleRef } from 'test/factories/make-module-ref';
import { Encrypter } from '@/domain/delivery/application/cryptography/encrypter';

describe('JwtEncrypter', () => {
  let encrypter: Encrypter;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    encrypter = moduleRef.get(Encrypter, { strict: false });
    jwtService = moduleRef.get(JwtService, { strict: false });
  });

  it('should encrypt a payload and return a JWT token', async () => {
    const token = await encrypter.encrypt({ sub: 'user-id-123' });

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('should produce a token with the given payload', async () => {
    const payload = { sub: 'user-id-123', role: 'admin' };
    const token = await encrypter.encrypt(payload);

    const decoded = jwtService.verify<typeof payload>(token);

    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.role).toBe(payload.role);
  });
});
