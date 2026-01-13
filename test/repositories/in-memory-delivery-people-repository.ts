import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { DeliveryPeopleRepository } from '@/domain/delivery/application/repositories/delivery-people-repository';
import type { DeliveryPerson } from '@/domain/delivery/enterprise/entities/delivery-person';

export class InMemoryDeliveryPeopleRepository
  implements DeliveryPeopleRepository
{
  public deliveryPeople: DeliveryPerson[] = [];

  async register(data: DeliveryPerson): Promise<DeliveryPerson> {
    this.deliveryPeople.push(data);
    return data;
  }

  async findByCpf(cpf: string): Promise<DeliveryPerson | null> {
    const deliveryPerson = this.deliveryPeople.find(
      (person) => person.cpf.value === cpf
    );

    return deliveryPerson ?? null;
  }

  async findByEmail(email: string): Promise<DeliveryPerson | null> {
    const deliveryPerson = this.deliveryPeople.find(
      (person) => person.email === email
    );

    return deliveryPerson ?? null;
  }

  async findById(id: string): Promise<DeliveryPerson | null> {
    const deliveryPerson = this.deliveryPeople.find((person) =>
      person.id.equals(new UniqueEntityId(id))
    );

    return deliveryPerson ?? null;
  }
}
