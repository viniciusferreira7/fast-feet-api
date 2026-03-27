import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { HashComparer } from '@/domain/delivery/application/cryptography/hash-comparer';
import { HashGenerator } from '@/domain/delivery/application/cryptography/hash-generator';
import { EnvService } from '../env/env.service';

@Injectable()
export class ArgoHasher implements HashGenerator, HashComparer {
  constructor(private readonly envService: EnvService) {}

  compare(plain: string, hash: string): Promise<boolean> {
    const pepper = this.envService.get('ARGON2_PEPPER');
    return argon2.verify(hash, plain, {
      secret: Buffer.from(pepper),
    });
  }
  hash(plain: string): Promise<string> {
    const pepper = this.envService.get('ARGON2_PEPPER');

    return argon2.hash(plain, {
      type: argon2.argon2id,
      secret: Buffer.from(pepper),
      memoryCost: 2 ** 16, // 64MB
      timeCost: 5,
      parallelism: 3,
    });
  }
}
