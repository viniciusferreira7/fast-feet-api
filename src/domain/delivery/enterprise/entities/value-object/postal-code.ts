import { type Either, left, right } from '@/core/either';
import { ValueObject } from '@/core/entities/value-object/value-object';
import { InvalidPostalCode } from '@/domain/delivery/errors/invalid-postal-code-error';

interface PostalCodeProps {
  value: string;
}

export class PostalCode extends ValueObject<PostalCodeProps> {
  get value(): string {
    return this.props.value;
  }

  public static validate(postalCode: string) {
    return /^\d{5}-?\d{3}$/.test(postalCode);
  }

  public static create(
    props: PostalCodeProps
  ): Either<InvalidPostalCode, PostalCode> {
    const postalCodeValue = props.value;

    const isValidPostalCode = PostalCode.validate(postalCodeValue);

    if (!isValidPostalCode) {
      return left(new InvalidPostalCode());
    }

    return right(
      new PostalCode({
        value: postalCodeValue,
      })
    );
  }
}
