import { randomInt } from 'node:crypto';
import { type Either, left, right } from '@/core/either';
import { ValueObject } from '@/core/entities/value-object/value-object';
import { InvalidEmailCodeError } from '@/domain/delivery/errors/invalid-email-code-error';

interface VerificationCodeProps {
  code: string;
}

export class VerificationCode extends ValueObject<VerificationCodeProps> {
  private static readonly LENGTH = 8;

  get code() {
    return this.props.code;
  }

  static generateCode() {
    const max = 10 ** VerificationCode.LENGTH;
    const code = randomInt(0, max)
      .toString()
      .padStart(VerificationCode.LENGTH, '0');

    return code;
  }

  static isValidFormatOfCode(code: string) {
    const normalized = code;

    if (!new RegExp(`^\\d{${VerificationCode.LENGTH}}$`).test(normalized)) {
      return false;
    }

    return true;
  }

  static create(
    value?: string
  ): Either<InvalidEmailCodeError, VerificationCode> {
    const verificationCode = value ?? VerificationCode.generateCode();

    if (!VerificationCode.isValidFormatOfCode(verificationCode)) {
      return left(new InvalidEmailCodeError());
    }

    return right(new VerificationCode({ code: verificationCode }));
  }
}
