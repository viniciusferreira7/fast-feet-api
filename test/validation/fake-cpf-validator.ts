import type { CpfValidator } from '@/domain/delivery/application/validation/cpf-validator';

export class FakeCpfValidator implements CpfValidator {
  async validate(_cpf: string): Promise<boolean> {
    return true;
  }
}
