import type { RecipientPerson } from '../../enterprise/entities/recipient-person';

export abstract class RecipientPeopleRepository {
  abstract register(data: RecipientPerson): Promise<RecipientPerson>;
  abstract findByCpf(cpf: string): Promise<RecipientPerson | null>;
  abstract findByEmail(email: string): Promise<RecipientPerson | null>;
  abstract findById(email: string): Promise<RecipientPerson | null>;
}
