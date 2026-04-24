import type { RecipientPerson } from '@/domain/delivery/enterprise/entities/recipient-person';

interface RecipientPersonPresenterToHttp {
  id: string;
  name: string;
  cpf: string;
  email: string;
  created_at: Date;
  updated_at: Date | null;
}

export class RecipientPersonPresenter {
  public static toHttp(
    recipientPerson: RecipientPerson
  ): RecipientPersonPresenterToHttp {
    return {
      id: recipientPerson.id.toString(),
      name: recipientPerson.name,
      cpf: recipientPerson.cpf.value,
      email: recipientPerson.email,
      created_at: recipientPerson.createdAt,
      updated_at: recipientPerson.updatedAt,
    };
  }
}
