import type { DeliveryPerson } from '@/domain/delivery/enterprise/entities/delivery-person';

export interface DeliveryPersonPresenterToHttp {
  id: string;
  name: string;
  cpf: string;
  email: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
}

export class DeliveryPersonPresenter {
  public static toHttp(
    deliveryPerson: DeliveryPerson
  ): DeliveryPersonPresenterToHttp {
    return {
      id: deliveryPerson.id.toString(),
      name: deliveryPerson.name,
      cpf: deliveryPerson.cpf.value,
      email: deliveryPerson.email,
      is_active: deliveryPerson.isActive,
      created_at: deliveryPerson.createdAt,
      updated_at: deliveryPerson.updatedAt,
    };
  }
}
