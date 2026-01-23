import { type Either, left, right } from '@/core/either';
import { ValueObject } from '@/core/entities/value-object/value-object';
import { InvalidaPostCode } from '@/domain/delivery/errors/invalid-post-code-error';

interface PostCodeProps {
  value: string;
}

export class PostCode extends ValueObject<PostCodeProps> {
  get value(): string {
    return this.props.value;
  }

  public static validate(postCode: string) {
    return /^\d{5}-?\d{3}$/.test(postCode);
  }

  public static create(
    props: PostCodeProps
  ): Either<InvalidaPostCode, PostCode> {
    const postCodeValue = props.value;

    const isValidPostCode = PostCode.validate(postCodeValue);

    if (!isValidPostCode) {
      return left(new InvalidaPostCode());
    }

    return right(
      new PostCode({
        value: postCodeValue,
      })
    );
  }
}
