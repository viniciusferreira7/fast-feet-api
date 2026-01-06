import { AdminPerson } from '../../enterprise/entities/admin-person';

export abstract class AdminPersonsRepository {
  abstract register(data: AdminPerson): Promise<AdminPerson>;
}
