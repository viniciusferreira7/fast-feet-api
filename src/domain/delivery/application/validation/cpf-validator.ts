export abstract class CpfValidator {
  abstract validate(cpf: string): Promise<boolean>;
}
