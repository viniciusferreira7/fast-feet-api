import { Module } from '@nestjs/common';
import { Encrypter } from '@/domain/delivery/application/cryptography/encrypter';
import { HashComparer } from '@/domain/delivery/application/cryptography/hash-comparer';
import { HashGenerator } from '@/domain/delivery/application/cryptography/hash-generator';
import { ArgoHasher } from './argon-hasher';
import { JwtEncrypter } from './jwt-encrypter';

@Module({
  providers: [
    {
      provide: Encrypter,
      useClass: JwtEncrypter,
    },
    { provide: HashGenerator, useClass: ArgoHasher },
    { provide: HashComparer, useClass: ArgoHasher },
  ],
  exports: [Encrypter, HashGenerator, HashComparer],
})
export class CryptographyModule {}
