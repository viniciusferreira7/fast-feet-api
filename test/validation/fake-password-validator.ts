import { type Either, right } from '@/core/either';
import type { PasswordValidator } from '@/domain/delivery/application/validation/password-validator';
import type { WeakPasswordError } from '@/domain/delivery/errors/weak-password-error';

export class FakePasswordValidator implements PasswordValidator {
  validate(_password: string): Either<WeakPasswordError, { password: string }> {
    return right({ password: _password });
  }
}
