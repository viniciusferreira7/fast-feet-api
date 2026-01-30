export abstract class PasswordValidator {
  abstract validate(password: string): Promise<boolean>;
}
