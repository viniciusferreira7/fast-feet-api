export abstract class PostCodeValidator {
  abstract validate(postCode: string): Promise<boolean>;
}
