import type { PostalCodeValidator } from '@/domain/delivery/application/validation/postal-code-validator';

export class FakePostalCodeValidator implements PostalCodeValidator {
  async validate(_postalCode: string): Promise<boolean> {
    return true;
  }
}
