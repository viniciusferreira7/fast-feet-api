import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { DeliveryPersonAlreadyDisabledError } from '../../errors/delivery-person-already-disabled-error';
import { DeleteDeliveryPersonUseCase } from './delete-delivery-person';
import { CannotDisableDeliveryPersonWithActivePackagesError } from './errors/cannot-disable-delivery-person-with-active-packages-error';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let packagesRepository: InMemoryPackagesRepository;
let packagesHistoryRepository: InMemoryPackagesHistoryRepository;
let sut: DeleteDeliveryPersonUseCase;

describe('Delete Delivery Person', () => {
  beforeEach(() => {
    packagesHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packagesHistoryRepository
    );
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    sut = new DeleteDeliveryPersonUseCase(
      deliveryPeopleRepository,
      packagesRepository,
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

  it('should not be able to disable a delivery person with active packages', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');
    if (awaitingPickupStatus.isLeft()) throw new Error();

    const packageEntity = makePackage({
      deliveryPersonId: deliveryPerson.id,
      status: awaitingPickupStatus.value,
    });

    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      cpf: deliveryPerson.cpf.value,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        CannotDisableDeliveryPersonWithActivePackagesError
      );
    }
  });

  it.each([
    'awaiting_pickup',
    'picked_up',
    'at_distribution_center',
    'in_transit',
    'out_for_delivery',
    'failed_delivery',
  ] as const)('should not disable delivery person when package has status "%s"', async (statusValue) => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    const status = PackageStatus.create(statusValue);
    if (status.isLeft()) throw new Error();

    const packageEntity = makePackage({
      deliveryPersonId: deliveryPerson.id,
      status: status.value,
    });

    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      cpf: deliveryPerson.cpf.value,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        CannotDisableDeliveryPersonWithActivePackagesError
      );
    }
  });

  it('should be able to disable a delivery person whose packages are all completed', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    const deliveredStatus = PackageStatus.create('delivered');
    if (deliveredStatus.isLeft()) throw new Error();

    const packageEntity = makePackage({
      deliveryPersonId: deliveryPerson.id,
      status: deliveredStatus.value,
    });

    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      cpf: deliveryPerson.cpf.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.isActive).toBe(false);
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
