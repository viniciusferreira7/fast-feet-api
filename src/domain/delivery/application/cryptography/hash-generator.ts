export abstract class HashGenerator {
  abstract hash(plain: string): Promise<string>;
  //TODO: use argon2ID + pepper to generate hashes instead of bcrypt
}
