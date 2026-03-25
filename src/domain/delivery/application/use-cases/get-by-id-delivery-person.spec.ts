import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { DeliveryPerson } from '../../enterprise/entities/delivery-person';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { GetByIdDeliveryPersonUseCase } from './get-by-id-delivery-person';

let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: GetByIdDeliveryPersonUseCase;

describe('Get By Id Delivery Person', () => {
  beforeEach(() => {
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new GetByIdDeliveryPersonUseCase(
      deliveryPeopleRepository,
      adminPeopleRepository
    );
  });

  it('should be able to get delivery person info as an admin', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson).toBeInstanceOf(DeliveryPerson);
      expect(result.value.deliveryPerson.id.equals(deliveryPerson.id)).toBe(
        true
      );
    }
  });

  it('should be able to get own delivery person info', async () => {
    const deliveryPerson = makeDeliveryPerson();

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: deliveryPerson.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson).toBeInstanceOf(DeliveryPerson);
      expect(result.value.deliveryPerson.id.equals(deliveryPerson.id)).toBe(
        true
      );
    }
  });

  it('should not be able to get delivery person info with non-existent delivery person', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      deliveryPersonId: 'non-existent-delivery-person-id',
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to get delivery person info with non-admin author', async () => {
    const deliveryPerson1 = makeDeliveryPerson();
    const deliveryPerson2 = makeDeliveryPerson();

    await deliveryPeopleRepository.register(deliveryPerson1);
    await deliveryPeopleRepository.register(deliveryPerson2);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson1.id.toString(),
      authorId: deliveryPerson2.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });

  it('should not be able to get delivery person info with non-existent author', async () => {
    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: 'non-existent-author-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });
});
