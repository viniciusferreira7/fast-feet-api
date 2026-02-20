import { type Either, left, right } from '@/core/either';
import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { SameEmailError } from '../../application/use-cases/errors/same-email-error';
import { SamePasswordError } from '../../application/use-cases/errors/same-password-error';
import { DeliveryPersonAlreadyDisabledError } from '../../errors/delivery-person-already-disabled-error';
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
  isActive: boolean;
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

  get isActive() {
    return this.props.isActive;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  public disableProfile(): Either<DeliveryPersonAlreadyDisabledError, boolean> {
    if (this.props.isActive) {
      this.props.isActive = false;
      this.touch();

      return right(this.props.isActive);
    }

    return left(new DeliveryPersonAlreadyDisabledError());
  }

  public updateName(name: string): Either<null, string> {
    this.props.name = name;
    this.props.emailVerification = null;

    this.touch();

    return right(this.password);
  }

  public updateEmail(newEmail: string): Either<SameEmailError, string> {
    if (this.email === newEmail) {
      return left(new SameEmailError());
    }

    this.props.email = newEmail;

    this.props.emailVerification = null;

    this.touch();

    return right(this.password);
  }

  public updatePassword(
    newPassword: string
  ): Either<SamePasswordError, string> {
    if (this.password === newPassword) {
      return left(new SamePasswordError());
    }

    this.props.password = newPassword;

    this.props.emailVerification = null;

    this.touch();

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
    props: Optional<
      DeliveryPersonProps,
      'createdAt' | 'updatedAt' | 'isActive'
    >,
    id?: UniqueEntityId
  ) {
    return new DeliveryPerson(
      {
        ...props,
        createdAt: props?.createdAt ?? new Date(),
        updatedAt: props?.updatedAt ?? null,
        isActive: props.isActive ?? true,
      },
      id
    );
  }
}
