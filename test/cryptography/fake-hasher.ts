import type { HashCompare } from '@/domain/delivery/application/cryptography/hash-compare';
import type { HashGenerator } from '@/domain/delivery/application/cryptography/hash-generator';

export class FakeHasher implements HashGenerator, HashCompare {
  async hash(plain: string): Promise<string> {
    return plain.concat('-hashed');
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return plain.concat('-hashed') === hash;
  }
}
