import { type Either, left, right } from '@/core/either';
import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { SamePasswordError } from '../../application/use-cases/errors/same-password-error';
import { EmailVerification } from './email-verification';
import type { Cpf } from './value-object/cpf';

export interface RecipientPersonProps {
  name: string;
  cpf: Cpf;
  email: string;
  password: string;
  emailVerification: EmailVerification | null;
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

  get emailVerification() {
    return this.props.emailVerification;
  }

  get isEmailValidated() {
    return !!this.props?.emailVerification?.validatedAt;
  }

  public updatePassword(
    newPassword: string
  ): Either<SamePasswordError, string> {
    if (this.password === newPassword) {
      return left(new SamePasswordError());
    }

    this.props.password = newPassword;

    this.props.emailVerification = null;

    return right(this.password);
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
