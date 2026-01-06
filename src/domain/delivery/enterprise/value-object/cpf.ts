import { Either, left, right } from '@/core/either';
import { ValueObject } from '@/core/entities/value-object/value-object';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';

interface CpfProps {
  value: string;
}

export class Cpf extends ValueObject<CpfProps> {
  get value() {
    return this.props.value;
  }

  private static validate(cpf: string): boolean {
    const cleanedCpf = cpf.replace(/[^\d]/g, '');

    if (cleanedCpf.length !== 11) {
      return false;
    }

    if (/^(\d)\1{10}$/.test(cleanedCpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanedCpf.charAt(i), 10) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit >= 10) firstDigit = 0;

    if (firstDigit !== parseInt(cleanedCpf.charAt(9), 10)) {
      return false;
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanedCpf.charAt(i), 10) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    if (secondDigit >= 10) secondDigit = 0;

    if (secondDigit !== parseInt(cleanedCpf.charAt(10), 10)) {
      return false;
    }

    return true;
  }

  public static create(value: string): Either<InvalidateCpfError, Cpf> {
    if (!Cpf.validate(value)) {
      return left(new InvalidateCpfError());
    }

    const cleanedCpf = value.replace(/[^\d]/g, '');
    return right(new Cpf({ value: cleanedCpf }));
  }
}
