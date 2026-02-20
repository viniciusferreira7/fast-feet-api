import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { DeliveryPersonAlreadyDisabledError } from '../../errors/delivery-person-already-disabled-error';
import { DeleteDeliveryPersonUseCase } from './delete-delivery-person';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let sut: DeleteDeliveryPersonUseCase;

describe('Delete Delivery Person', () => {
  beforeEach(() => {
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    sut = new DeleteDeliveryPersonUseCase(
      deliveryPeopleRepository,
      adminPeopleRepository
    );
  });

  it('should be able to disable a delivery person', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      cpf: deliveryPerson.cpf.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.isActive).toBe(false);
    }
  });

  it('should persist the disabled state in the repository', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    await sut.execute({
      authorId: admin.id.toString(),
      cpf: deliveryPerson.cpf.value,
    });

    const updated = await deliveryPeopleRepository.findByCpf(
      deliveryPerson.cpf.value
    );

    expect(updated?.isActive).toBe(false);
  });

  it('should return ResourceNotFoundError when delivery person does not exist', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      cpf: '000.000.000-00',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should return OnlyAdminCanPerformThisActionError when author is not an admin', async () => {
    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      authorId: 'non-admin-id',
      cpf: deliveryPerson.cpf.value,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });

  it('should return DeliveryPersonAlreadyDisabledError when profile is already disabled', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const deliveryPerson = makeDeliveryPerson({ isActive: false });
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      cpf: deliveryPerson.cpf.value,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DeliveryPersonAlreadyDisabledError);
    }
  });
});
