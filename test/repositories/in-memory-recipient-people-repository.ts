import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { RecipientPeopleRepository } from '@/domain/delivery/application/repositories/recipient-people-repository';
import type { RecipientPerson } from '@/domain/delivery/enterprise/entities/recipient-person';

export class InMemoryRecipientPeopleRepository
  implements RecipientPeopleRepository
{
  public recipientPeople: RecipientPerson[] = [];

  async register(data: RecipientPerson): Promise<RecipientPerson> {
    this.recipientPeople.push(data);
    return data;
  }

  async findByCpf(cpf: string): Promise<RecipientPerson | null> {
    const recipientPerson = this.recipientPeople.find(
      (person) => person.cpf.value === cpf
    );

    return recipientPerson ?? null;
  }

  async findByEmail(email: string): Promise<RecipientPerson | null> {
    const recipientPerson = this.recipientPeople.find(
      (person) => person.email === email
    );

    return recipientPerson ?? null;
  }

  async findById(id: string): Promise<RecipientPerson | null> {
    const recipientPerson = this.recipientPeople.find((person) =>
      person.id.equals(new UniqueEntityId(id))
    );

    return recipientPerson ?? null;
  }
}
