import type { PostCodeValidator } from '@/domain/delivery/application/validation/post-code-validator';

export class FakePostCodeValidator implements PostCodeValidator {
  async validate(_postCode: string): Promise<boolean> {
    return true;
  }
}
