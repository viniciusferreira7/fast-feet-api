import { type Either, left, right } from '@/core/either';
import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { EmailCodeError } from '../../errors/email-code-expired-error';
import type { InvalidEmailCodeError } from '../../errors/invalid-email-code-error';
import { VerificationCode } from './value-object/verification-code';

interface EmailVerificationProps {
  code: VerificationCode;
  createdAt: Date;
  validatedAt: Date | null;
}

export class EmailVerification extends Entity<EmailVerificationProps> {
  get code() {
    return this.props.code;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get validatedAt() {
    return this.props.validatedAt;
  }

  private isCodeExpired() {
    const differenceInMilliseconds =
      Date.now() - this.props.createdAt.getTime();
    const FIVE_MINUTES = 1000 * 60 * 5;
    return differenceInMilliseconds > FIVE_MINUTES;
  }

  static create(
    props: Optional<
      EmailVerificationProps,
      'code' | 'createdAt' | 'validatedAt'
    >,
    id?: UniqueEntityId
  ): Either<EmailCodeError | InvalidEmailCodeError, EmailVerification> {
    if (id && props.code) {
      const emailVerification = new EmailVerification(
        {
          code: props.code,
          createdAt: props.createdAt ?? new Date(),
          validatedAt: props.validatedAt ?? null,
        },
        id
      );

      if (emailVerification.isCodeExpired()) {
        return left(new EmailCodeError());
      }

      return right(emailVerification);
    }

    const verificationCode = VerificationCode.create();

    if (verificationCode.isLeft()) {
      return left(verificationCode.value);
    }

    return right(
      new EmailVerification({
        code: verificationCode.value,
        createdAt: props.createdAt ?? new Date(),
        validatedAt: props.validatedAt ?? null,
      })
    );
  }
}
