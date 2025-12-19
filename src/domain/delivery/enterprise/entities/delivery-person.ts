import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { Cpf } from '../value-object/cpf';

export interface DeliveryPersonProps {
  id: UniqueEntityId;
  name: string;
  cpf: Cpf;
  password: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export class DeliveryPerson extends AggregateRoot<DeliveryPersonProps> {
  get id() {
    return this.props.id;
  }
  get name() {
    return this.props.name;
  }
  get cpf() {
    return this.props.cpf;
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

  public static create(props: DeliveryPersonProps, id?: UniqueEntityId) {
    return new DeliveryPerson(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );
  }
}
