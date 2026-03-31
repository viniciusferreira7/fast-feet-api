import { Test } from '@nestjs/testing';
import { EnvService } from '../env/env.service';
import { ArgoHasher } from './argon-hasher';

const makeEnvService = (): Partial<EnvService> => ({
  get: vi.fn().mockReturnValue('test-pepper-secret'),
});

describe('ArgoHasher', () => {
  let hasher: ArgoHasher;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ArgoHasher,
        { provide: EnvService, useValue: makeEnvService() },
      ],
    }).compile();

    hasher = module.get(ArgoHasher);
  });

  it('should hash a plain text', async () => {
    const hash = await hasher.hash('password123');

    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('password123');
  });

  it('should return true when comparing a plain text with its hash', async () => {
    const plain = 'password123';
    const hash = await hasher.hash(plain);

    const result = await hasher.compare(plain, hash);

    expect(result).toBe(true);
  });

  it('should return false when comparing wrong plain text against a hash', async () => {
    const hash = await hasher.hash('password123');

    const result = await hasher.compare('wrong-password', hash);

    expect(result).toBe(false);
  });

  it('should produce different hashes for the same input', async () => {
    const hash1 = await hasher.hash('password123');
    const hash2 = await hasher.hash('password123');

    expect(hash1).not.toBe(hash2);
  });
});
