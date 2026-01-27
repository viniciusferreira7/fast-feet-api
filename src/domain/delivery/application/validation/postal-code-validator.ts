export abstract class PostalCodeValidator {
  abstract validate(postalCode: string): Promise<boolean>;
}
