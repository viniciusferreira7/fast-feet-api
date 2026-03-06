import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { Pagination } from '@/core/entities/value-object/pagination';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { FetchManyDeliveryPersonUseCase } from './fetch-many-delivery-person';

let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: FetchManyDeliveryPersonUseCase;

describe('Fetch Many Delivery Person', () => {
  beforeEach(() => {
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new FetchManyDeliveryPersonUseCase(
      deliveryPeopleRepository,
      adminPeopleRepository
    );
  });

  it('should be able to fetch delivery people as an admin', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(makeDeliveryPerson());
    await deliveryPeopleRepository.register(makeDeliveryPerson());

    const result = await sut.execute({ authorId: admin.id.toString() });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople).toBeInstanceOf(Pagination);
      expect(result.value.deliveryPeople.result).toHaveLength(2);
    }
  });

  it('should return an empty list when no delivery people exist', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);

    const result = await sut.execute({ authorId: admin.id.toString() });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(0);
    }
  });

  it('should respect pagination params', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);

    for (let i = 0; i < 5; i++) {
      await deliveryPeopleRepository.register(makeDeliveryPerson());
    }

    const result = await sut.execute({
      authorId: admin.id.toString(),
      page: 1,
      perPage: 3,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(3);
      expect(result.value.deliveryPeople.page).toBe(1);
      expect(result.value.deliveryPeople.perPage).toBe(3);
    }
  });

  it('should return next page correctly', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);

    for (let i = 0; i < 5; i++) {
      await deliveryPeopleRepository.register(makeDeliveryPerson());
    }

    const result = await sut.execute({
      authorId: admin.id.toString(),
      page: 2,
      perPage: 3,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(2);
      expect(result.value.deliveryPeople.page).toBe(2);
    }
  });

  it('should not be able to fetch delivery people with non-existent admin', async () => {
    const result = await sut.execute({ authorId: 'non-existent-admin-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });
});
