import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { AdminPeopleRepository } from '@/domain/delivery/application/repositories/admin-people-repository';
import type { AdminPerson } from '@/domain/delivery/enterprise/entities/admin-person';

export class InMemoryAdminPeopleRepository implements AdminPeopleRepository {
  public adminPeople: AdminPerson[] = [];

  async register(data: AdminPerson): Promise<AdminPerson> {
    this.adminPeople.push(data);
    return data;
  }

  async findByCpf(cpf: string): Promise<AdminPerson | null> {
    const adminPerson = this.adminPeople.find(
      (person) => person.cpf.value === cpf
    );

    return adminPerson ?? null;
  }

  async findByEmail(email: string): Promise<AdminPerson | null> {
    const adminPerson = this.adminPeople.find(
      (person) => person.email === email
    );

    return adminPerson ?? null;
  }

  async findById(id: string): Promise<AdminPerson | null> {
    const adminPerson = this.adminPeople.find((person) =>
      person.id.equals(new UniqueEntityId(id))
    );

    return adminPerson ?? null;
  }
}
