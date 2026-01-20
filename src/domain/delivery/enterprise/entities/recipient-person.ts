import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import type { Cpf } from './value-object/cpf';

export interface RecipientPersonProps {
  name: string;
  cpf: Cpf;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export class RecipientPerson extends AggregateRoot<RecipientPersonProps> {
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
    props: Optional<RecipientPersonProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId
  ) {
    return new RecipientPerson(
      {
        ...props,
        createdAt: props?.createdAt ?? new Date(),
        updatedAt: props?.updatedAt ?? null,
      },
      id
    );
  }
}
