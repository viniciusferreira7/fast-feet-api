import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { Package } from '../../enterprise/entities/package';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { AssignPackageToADeliveryPerson } from './assign-package-to-a-delivery-person';
import { ResourceNotFoundError } from './errors/resource-not-found-error';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: AssignPackageToADeliveryPerson;

describe('Assign Package to a Delivery Person', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new AssignPackageToADeliveryPerson(
      packagesRepository,
      deliveryPeopleRepository,
      adminPeopleRepository
    );
  });

  it('should be able to assign package to a delivery person', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({ deliveryPersonId: null });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.deliveryPersonId?.toString()).toBe(
        deliveryPerson.id.toString()
      );
      expect(result.value.package.status.isAwaitingPickup()).toBe(true);
    }
  });

  it('should update package status to awaiting_pickup when assigning delivery person', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({ deliveryPersonId: null });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.status).toBeInstanceOf(PackageStatus);
      expect(result.value.package.status.isAwaitingPickup()).toBe(true);
    }
  });

  it('should create package history when assigning delivery person', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({ deliveryPersonId: null });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const initialHistoryCount = packageEntity.histories.getItems().length;

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.histories.getItems().length).toBe(
        initialHistoryCount + 2
      );
    }
  });

  it('should be able to assign package with custom description', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({ deliveryPersonId: null });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const customDescription = 'Assigned to John Doe for delivery';

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
      description: customDescription,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const histories = result.value.package.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe(customDescription);
    }
  });

  it('should not be able to assign package with non-existent admin', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({ deliveryPersonId: null });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: 'non-existent-admin-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to assign package with non-existent delivery person', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage({ deliveryPersonId: null });

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: 'non-existent-delivery-person-id',
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to assign non-existent package', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      packageId: 'non-existent-package-id',
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should update package in repository', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({ deliveryPersonId: null });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    const updatedPackage = await packagesRepository.findById(
      packageEntity.id.toString()
    );

    expect(updatedPackage).toBeTruthy();
    expect(updatedPackage?.deliveryPersonId?.toString()).toBe(
      deliveryPerson.id.toString()
    );
    expect(updatedPackage?.status.isAwaitingPickup()).toBe(true);
  });

  it('should reassign package to different delivery person', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson1 = makeDeliveryPerson();
    const deliveryPerson2 = makeDeliveryPerson();
    const packageEntity = makePackage({
      deliveryPersonId: deliveryPerson1.id,
    });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson1);
    await deliveryPeopleRepository.register(deliveryPerson2);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson2.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.deliveryPersonId?.toString()).toBe(
        deliveryPerson2.id.toString()
      );
    }
  });
});
