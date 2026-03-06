import { Pagination } from '@/core/entities/value-object/pagination';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type {
  DeliveryPeopleRepository,
  FindManyDeliveryPersonParams,
} from '@/domain/delivery/application/repositories/delivery-people-repository';
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

  async findManyDeliveryPerson(
    params: FindManyDeliveryPersonParams
  ): Promise<Pagination<DeliveryPerson>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 10;

    let filtered = this.deliveryPeople;

    if (params.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        (person) =>
          person.name.toLowerCase().includes(search) ||
          person.email.toLowerCase().includes(search)
      );
    }

    if (params.createdAtGte) {
      const createdAtGte = params.createdAtGte;
      filtered = filtered.filter((person) => person.createdAt >= createdAtGte);
    }

    if (params.updatedAtGte) {
      const updatedAtGte = params.updatedAtGte;
      filtered = filtered.filter(
        (person) => person.updatedAt != null && person.updatedAt >= updatedAtGte
      );
    }

    const startIndex = (page - 1) * perPage;
    const paginated = filtered.slice(startIndex, startIndex + perPage);
    const totalPages = Math.ceil(filtered.length / perPage);

    return Pagination.create<DeliveryPerson>({
      page,
      perPage,
      totalPages,
      result: paginated,
    });
  }

  async update(data: DeliveryPerson): Promise<null> {
    const index = this.deliveryPeople.findIndex((person) =>
      person.id.equals(data.id)
    );

    if (index !== -1) {
      this.deliveryPeople[index] = data;
    }

    return null;
  }
}
