import { AdminPerson } from '../../enterprise/entities/admin-person';

export abstract class AdminPeopleRepository {
  abstract register(data: AdminPerson): Promise<AdminPerson>;
  abstract findByCpf(cpf: string): Promise<AdminPerson | null>;
  abstract findByEmail(email: string): Promise<AdminPerson | null>;
}
