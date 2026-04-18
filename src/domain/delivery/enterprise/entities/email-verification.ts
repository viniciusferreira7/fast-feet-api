import { type Either, left, right } from '@/core/either';
import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { EmailCodeExpiredError } from '../../errors/email-code-expired-error';
import type { InvalidEmailCodeError } from '../../errors/invalid-email-code-error';
import { VerificationCode } from './value-object/verification-code';

interface EmailVerificationProps {
  verificationCode: VerificationCode;
  createdAt: Date;
  validatedAt: Date | null;
}

export class EmailVerification extends Entity<EmailVerificationProps> {
  get verificationCode() {
    return this.props.verificationCode;
  }

  get code() {
    return this.props.verificationCode.code;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get validatedAt() {
    return this.props.validatedAt;
  }

  public validateCode(code: string): boolean {
    if (this.props.verificationCode.validateCode(code)) {
      this.props.validatedAt = new Date();
      return true;
    }

    return false;
  }

  public isCodeExpired(): boolean {
    const differenceInMilliseconds =
      Date.now() - this.props.createdAt.getTime();
    const FIVE_MINUTES = 1000 * 60 * 5;
    return differenceInMilliseconds > FIVE_MINUTES;
  }

  public timeInMinutesToExpireCode() {
    const differenceInMilliseconds =
      Date.now() - this.props.createdAt.getTime();
    const FIVE_MINUTES = 1000 * 60 * 5;

    const time = Math.round(
      Math.ceil(differenceInMilliseconds - FIVE_MINUTES) / 60 / 60
    );

    return time;
  }

  /**
   * Reconstructs an EmailVerification from persistence without re-validating
   * expiry. Use this in mappers/repositories — never for new verifications.
   */
  public static restore(
    props: EmailVerificationProps,
    id: UniqueEntityId
  ): EmailVerification {
    return new EmailVerification(props, id);
  }

  static create(
    props: Optional<
      EmailVerificationProps,
      'verificationCode' | 'createdAt' | 'validatedAt'
    >,
    id?: UniqueEntityId
  ): Either<EmailCodeExpiredError | InvalidEmailCodeError, EmailVerification> {
    if (id && props.verificationCode) {
      const emailVerification = new EmailVerification(
        {
          verificationCode: props.verificationCode,
          createdAt: props.createdAt ?? new Date(),
          validatedAt: props.validatedAt ?? null,
        },
        id
      );

      if (emailVerification.isCodeExpired()) {
        return left(new EmailCodeExpiredError());
      }

      return right(emailVerification);
    }

    const verificationCode = VerificationCode.create();

    if (verificationCode.isLeft()) {
      return left(verificationCode.value);
    }

    return right(
      new EmailVerification({
        verificationCode: verificationCode.value,
        createdAt: props.createdAt ?? new Date(),
        validatedAt: props.validatedAt ?? null,
      })
    );
  }
}
