import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtEncrypter } from './jwt-encrypter';

describe('JwtEncrypter', () => {
  let encrypter: JwtEncrypter;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1d' },
        }),
      ],
      providers: [JwtEncrypter],
    }).compile();

    encrypter = module.get(JwtEncrypter);
    jwtService = module.get(JwtService);
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
