import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { EmailVerification } from './email-verification';
import type { Cpf } from './value-object/cpf';

export interface DeliveryPersonProps {
  name: string;
  cpf: Cpf;
  email: string;
  password: string;
  createdAt: Date;
  emailVerification: EmailVerification | null;
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

  get emailVerification() {
    return this.props.emailVerification;
  }

  get isEmailValidated() {
    return !!this.props?.emailVerification?.validatedAt;
  }

  public createNewEmailVerification(): boolean {
    const emailVerification = EmailVerification.create({});

    if (emailVerification.isRight()) {
      this.props.emailVerification = emailVerification.value;

      return true;
    }

    return false;
  }

  public static create(
    props: Optional<DeliveryPersonProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId
  ) {
    return new DeliveryPerson(
      {
        ...props,
        createdAt: props?.createdAt ?? new Date(),
        updatedAt: props?.updatedAt ?? null,
      },
      id
    );
  }
}
