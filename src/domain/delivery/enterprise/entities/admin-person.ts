import { type Either, left, right } from '@/core/either';
import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { SameEmailError } from '../../application/use-cases/errors/same-email-error';
import { SamePasswordError } from '../../application/use-cases/errors/same-password-error';
import { EmailVerification } from './email-verification';
import type { Cpf } from './value-object/cpf';

export interface AdminPersonProps {
  name: string;
  cpf: Cpf;
  email: string;
  password: string;
  emailVerification: EmailVerification | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export class AdminPerson extends AggregateRoot<AdminPersonProps> {
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

  private touch() {
    this.props.updatedAt = new Date();
  }

  public updateName(name: string): Either<null, string> {
    this.props.name = name;
    this.props.emailVerification = null;

    this.touch();

    return right(this.name);
  }

  public updateEmail(newEmail: string): Either<SameEmailError, string> {
    if (this.email === newEmail) {
      return left(new SameEmailError());
    }

    this.props.email = newEmail;
    this.props.emailVerification = null;

    this.touch();

    return right(this.email);
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
    props: Optional<AdminPersonProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityId
  ) {
    return new AdminPerson(
      {
        ...props,
        createdAt: props?.createdAt ?? new Date(),
        updatedAt: props?.updatedAt ?? null,
      },
      id
    );
  }
}
