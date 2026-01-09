import { generate as generateCpf } from 'gerador-validador-cpf';
import { InvalidateCpfError } from '@/domain/delivery/errors/invalidate-cpf-error';
import { Cpf } from './cpf';

describe('CPF', () => {
  it('should be able to register validate CPF', () => {
    const cpfRaw = generateCpf();
    const result = Cpf.create(cpfRaw);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toBeInstanceOf(Cpf);
      expect(result.value.value).toEqual(cpfRaw);
    }
  });

  it('should not be able to register invalidate CPF', () => {
    const cpfRaw = 'sfsdgzgfgfdg';
    const result = Cpf.create(cpfRaw);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidateCpfError);
    }
  });

  it('should not be able to register CPF with same numbers CPF', () => {
    const cpfRaw = '11111111111';
    const result = Cpf.create(cpfRaw);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidateCpfError);
    }
  });

  it('should not be able to register CPF less than 11 numbers', () => {
    const cpfRaw = generateCpf().slice(0, 10);
    const result = Cpf.create(cpfRaw);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidateCpfError);
    }
  });

  it('should not be able to register CPF if as non-number character', () => {
    let cpfRaw = generateCpf();

    const arr = cpfRaw.split('');

    arr[5] = 'a';

    cpfRaw = arr.join('');

    const result = Cpf.create(cpfRaw);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidateCpfError);
    }
  });
});
