import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { Cpf } from '../value-object/cpf';

export interface DeliveryPersonProps {
  name: string;
  cpf: Cpf;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export class DeliveryPerson extends AggregateRoot<DeliveryPersonProps> {
  get name() {
    return this.props.name;
  }
  get cpf() {
    return this.props.cpf;
  }
  get email() {
    return this.props.email;
  }
  get password() {
    return this.props.password;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  public static create(
    props: Optional<DeliveryPersonProps, 'createdAt'>,
    id?: UniqueEntityId
  ) {
    return new DeliveryPerson(
      {
        ...props,
        createdAt: props?.createdAt ?? new Date(),
      },
      id
    );
  }
}
