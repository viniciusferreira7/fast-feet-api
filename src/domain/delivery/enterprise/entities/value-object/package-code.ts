import { Either, left, right } from '@/core/either';
import { ValueObject } from '@/core/entities/value-object/value-object';
import { InvalidatePackageCodeError } from '@/domain/delivery/errors/invalidate-package-code-error';

interface PackageCodeProps {
  value: string;
}

export class PackageCode extends ValueObject<PackageCodeProps> {
  get value() {
    return this.props.value;
  }

  private static validate(code: string): boolean {
    const ulidRegex = /^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i;

    if (!ulidRegex.test(code)) {
      return false;
    }

    const timestampPart = code.substring(0, 10).toUpperCase();
    const timestamp = PackageCode.decodeTime(timestampPart);

    if (timestamp > Date.now()) {
      return false;
    }

    return true;
  }

  private static decodeTime(timestampPart: string): number {
    const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let time = 0;

    for (let i = 0; i < timestampPart.length; i++) {
      const char = timestampPart[i];
      const value = ENCODING.indexOf(char);
      time = time * 32 + value;
    }

    return time;
  }

  private static generateULID(): string {
    const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    const time = Date.now();
    let timeStr = '';
    let tempTime = time;

    for (let i = 9; i >= 0; i--) {
      const mod = tempTime % 32;
      timeStr = ENCODING[mod] + timeStr;
      tempTime = Math.floor(tempTime / 32);
    }

    let randomStr = '';
    for (let i = 0; i < 16; i++) {
      randomStr += ENCODING[Math.floor(Math.random() * 32)];
    }

    return timeStr + randomStr;
  }

  public static create(
    value?: string
  ): Either<InvalidatePackageCodeError, PackageCode> {
    const code = value ?? PackageCode.generateULID();

    if (!PackageCode.validate(code)) {
      return left(new InvalidatePackageCodeError());
    }

    return right(new PackageCode({ value: code.toUpperCase() }));
  }

  public static generate(): Either<InvalidatePackageCodeError, PackageCode> {
    return PackageCode.create();
  }
}
