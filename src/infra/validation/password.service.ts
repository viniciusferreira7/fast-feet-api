import { Injectable } from '@nestjs/common';
import zxcvbn from 'zxcvbn';
import { type Either, left, right } from '@/core/either';
import { PasswordValidator } from '@/domain/delivery/application/validation/password-validator';
import { WeakPasswordError } from '@/domain/delivery/errors/weak-password-error';

@Injectable()
export class PasswordService implements PasswordValidator {
  validate(password: string): Either<WeakPasswordError, { password: string }> {
    const result = zxcvbn(password);

    if (result.score < 3) {
      const suggestions =
        result.feedback.suggestions.length > 0
          ? `Feedback: ${result.feedback.suggestions.join(', ')}`
          : '';
      const warning =
        result.feedback.warning.length > 0
          ? `Warning: ${result.feedback.warning}`
          : '';

      const parts = [suggestions, warning].filter(Boolean);

      return left(new WeakPasswordError(parts.join(' | ')));
    }

    return right({ password });
  }
}
