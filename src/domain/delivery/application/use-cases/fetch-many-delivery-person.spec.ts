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

  it('should filter by search term across name and email', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ name: 'John Doe', email: 'other@example.com' })
    );
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ name: 'Jane Smith', email: 'john@example.com' })
    );
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ name: 'Alice', email: 'alice@example.com' })
    );

    const result = await sut.execute({
      authorId: admin.id.toString(),
      search: 'john',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(2);
    }
  });

  it('should filter by email', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ email: 'target@example.com' })
    );
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ email: 'other@example.com' })
    );

    const result = await sut.execute({
      authorId: admin.id.toString(),
      email: 'target',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(1);
      expect(result.value.deliveryPeople.result[0].email).toBe(
        'target@example.com'
      );
    }
  });

  it('should filter by name', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ name: 'Carlos Silva' })
    );
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ name: 'Maria Souza' })
    );

    const result = await sut.execute({
      authorId: admin.id.toString(),
      name: 'carlos',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(1);
      expect(result.value.deliveryPeople.result[0].name).toBe('Carlos Silva');
    }
  });

  it('should filter by cpf', async () => {
    const admin = makeAdminPerson();
    const targetPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(targetPerson);
    await deliveryPeopleRepository.register(makeDeliveryPerson());

    const result = await sut.execute({
      authorId: admin.id.toString(),
      cpf: targetPerson.cpf.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(1);
      expect(
        result.value.deliveryPeople.result[0].cpf.equals(targetPerson.cpf)
      ).toBe(true);
    }
  });

  it('should filter by isActive true', async () => {
    const admin = makeAdminPerson();
    const activePerson = makeDeliveryPerson({ isActive: true });
    const inactivePerson = makeDeliveryPerson({ isActive: false });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(activePerson);
    await deliveryPeopleRepository.register(inactivePerson);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      isActive: true,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(1);
      expect(result.value.deliveryPeople.result[0].isActive).toBe(true);
    }
  });

  it('should filter by isActive false', async () => {
    const admin = makeAdminPerson();
    const activePerson = makeDeliveryPerson({ isActive: true });
    const inactivePerson = makeDeliveryPerson({ isActive: false });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(activePerson);
    await deliveryPeopleRepository.register(inactivePerson);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      isActive: false,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(1);
      expect(result.value.deliveryPeople.result[0].isActive).toBe(false);
    }
  });

  it('should filter by createdAtGte', async () => {
    const admin = makeAdminPerson();
    const past = new Date('2024-01-01');
    const recent = new Date('2025-01-01');
    const threshold = new Date('2024-06-01');

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ createdAt: past })
    );
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ createdAt: recent })
    );

    const result = await sut.execute({
      authorId: admin.id.toString(),
      createdAtGte: threshold,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(1);
      expect(result.value.deliveryPeople.result[0].createdAt).toEqual(recent);
    }
  });

  it('should filter by updatedAtGte', async () => {
    const admin = makeAdminPerson();
    const past = new Date('2024-01-01');
    const recent = new Date('2025-01-01');
    const threshold = new Date('2024-06-01');

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ updatedAt: past })
    );
    await deliveryPeopleRepository.register(
      makeDeliveryPerson({ updatedAt: recent })
    );
    await deliveryPeopleRepository.register(makeDeliveryPerson());

    const result = await sut.execute({
      authorId: admin.id.toString(),
      updatedAtGte: threshold,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPeople.result).toHaveLength(1);
      expect(result.value.deliveryPeople.result[0].updatedAt).toEqual(recent);
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
