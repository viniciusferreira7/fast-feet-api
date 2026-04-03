import type { Either } from '@/core/either';
import type { WeakPasswordError } from '../../errors/weak-password-error';

export abstract class PasswordValidator {
  abstract validate(
    password: string
  ): Either<WeakPasswordError, { password: string }>;
}
