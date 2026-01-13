import { DeliveryPerson } from '../../enterprise/entities/delivery-person';

export abstract class DeliveryPeopleRepository {
  abstract register(data: DeliveryPerson): Promise<DeliveryPerson>;
  abstract findByCpf(cpf: string): Promise<DeliveryPerson | null>;
  abstract findByEmail(email: string): Promise<DeliveryPerson | null>;
  abstract findById(email: string): Promise<DeliveryPerson | null>;
}
