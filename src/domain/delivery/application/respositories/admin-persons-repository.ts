import type { AdminPerson } from '../../enterprise/entities/admin-person';

export interface AdminPersonsRepository {
  register(data: AdminPerson): Promise<AdminPerson>;
}
