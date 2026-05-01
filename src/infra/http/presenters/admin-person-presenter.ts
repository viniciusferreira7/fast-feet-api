import type { AdminPerson } from '@/domain/delivery/enterprise/entities/admin-person';

export interface AdminPersonPresenterToHttp {
  id: string;
  name: string;
  cpf: string;
  email: string;
  created_at: Date;
  updated_at: Date | null;
}

export class AdminPersonPresenter {
  public static toHttp(adminPerson: AdminPerson): AdminPersonPresenterToHttp {
    return {
      id: adminPerson.id.toString(),
      name: adminPerson.name,
      cpf: adminPerson.cpf.value,
      email: adminPerson.email,
      created_at: adminPerson.createdAt,
      updated_at: adminPerson.updatedAt,
    };
  }
}
