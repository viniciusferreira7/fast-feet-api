import { ValueObject } from './value-object';

interface UniqueEntityIdProps {
  value: string;
}

export class UniqueEntityId extends ValueObject<UniqueEntityIdProps> {
  toString() {
    return this.props.value.toString();
  }

  toValue() {
    return this.props.value;
  }

  public equals(id: UniqueEntityId) {
    return id.toValue() === this.toValue();
  }
}
