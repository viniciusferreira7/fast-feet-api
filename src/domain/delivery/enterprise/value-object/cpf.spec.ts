import { generate as generateCpf } from 'gerador-validador-cpf';
import { InvalidateCpfError } from '../../errors/invalidate-cpf-error';
import { Cpf } from './cpf';

describe('CPF', () => {
  it('should be able to register validate CPF', () => {
    const cpfRaw = generateCpf();
    const cpf = Cpf.create(cpfRaw);

    expect(cpf).toBeInstanceOf(Cpf);
    expect(cpf?.value).toEqual(cpfRaw);
  });

  it('should not be able to register invalidate CPF', () => {
    const cpfRaw = 'sfsdgzgfgfdg';

    expect(() => {
      Cpf.create(cpfRaw);
    }).toThrow(InvalidateCpfError);
  });

  it('should not be able to register CPF with same numbers CPF', () => {
    const cpfRaw = '11111111111';

    expect(() => {
      Cpf.create(cpfRaw);
    }).toThrow(InvalidateCpfError);
  });

  it('should not be able to register CPF less than 11 numbers', () => {
    const cpfRaw = generateCpf().slice(0, 10);

    expect(() => {
      Cpf.create(cpfRaw);
    }).toThrow(InvalidateCpfError);
  });

  it('should not be able to register CPF if as non-number character', () => {
    let cpfRaw = generateCpf();

    const arr = cpfRaw.split('');

    arr[5] = 'a';

    cpfRaw = arr.join('');

    expect(() => {
      Cpf.create(cpfRaw);
    }).toThrow(InvalidateCpfError);
  });
});
