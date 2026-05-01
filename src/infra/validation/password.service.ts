import { Injectable } from '@nestjs/common';
import zxcvbn from 'zxcvbn';
import { type Either, left, right } from '@/core/either';
import { PasswordValidator } from '@/domain/delivery/application/validation/password-validator';
import { WeakPasswordError } from '@/domain/delivery/errors/weak-password-error';
import { EnvService } from '../env/env.service';

@Injectable()
export class PasswordService implements PasswordValidator {
  constructor(private readonly envService: EnvService) {}

  validate(password: string): Either<WeakPasswordError, { password: string }> {
    const minLength = Number(this.envService.get('PASSWORD_MIN_LENGTH'));
    const minScore = Number(this.envService.get('PASSWORD_MIN_SCORE'));

    if (password.length < minLength) {
      return left(
        new WeakPasswordError(
          `Password must be at least ${minLength} characters long`
        )
      );
    }

    const result = zxcvbn(password);

    if (result.score < minScore) {
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
