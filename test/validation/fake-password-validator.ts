import type { PasswordValidator } from '@/domain/delivery/application/validation/password-validator';

export class FakePasswordValidator implements PasswordValidator {
  async validate(_password: string): Promise<boolean> {
    return true;
  }
}
