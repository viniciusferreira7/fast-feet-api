import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { Package } from '../../enterprise/entities/package';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { PackageNotAssignedToDeliveryPersonError } from './errors/package-not-assigned-to-delivery-person-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { PackageIsInTransitUsaCase } from './package-is-in-transit';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: PackageIsInTransitUsaCase;

describe('Package Is In Transit', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new PackageIsInTransitUsaCase(
      adminPeopleRepository,
      deliveryPeopleRepository,
      packagesRepository
    );
  });

  it('should be able to mark a package as in transit', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      throw new Error('Failed to create at_distribution_center status');
    }

    const packageEntity = makePackage({
      status: atDistributionCenterStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.status.isInTransit()).toBe(true);
    }
  });

  it('should transition package status to in_transit', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      throw new Error('Failed to create at_distribution_center status');
    }

    const packageEntity = makePackage({
      status: atDistributionCenterStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.status).toBeInstanceOf(PackageStatus);
      expect(result.value.package.status.value).toBe('in_transit');
    }
  });

  it('should persist the updated package in the repository', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      throw new Error('Failed to create at_distribution_center status');
    }

    const packageEntity = makePackage({
      status: atDistributionCenterStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    const updatedPackage = await packagesRepository.findById(
      packageEntity.id.toString()
    );

    expect(updatedPackage).toBeTruthy();
    expect(updatedPackage?.status.isInTransit()).toBe(true);
  });

  it('should create a package history entry on marking as in transit', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      throw new Error('Failed to create at_distribution_center status');
    }

    const packageEntity = makePackage({
      status: atDistributionCenterStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const initialHistoryCount = packageEntity.histories.getItems().length;

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.histories.getItems().length).toBe(
        initialHistoryCount + 1
      );
    }
  });

  it('should store custom description in history when provided', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      throw new Error('Failed to create at_distribution_center status');
    }

    const packageEntity = makePackage({
      status: atDistributionCenterStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const customDescription = 'Dispatched from central hub';

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      description: customDescription,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const histories = result.value.package.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe(customDescription);
    }
  });

  it('should store default description in history when not provided', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      throw new Error('Failed to create at_distribution_center status');
    }

    const packageEntity = makePackage({
      status: atDistributionCenterStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const histories = result.value.package.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe('Package is in transit');
    }
  });

  it('should not be able to mark as in transit with a non-existent admin', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      throw new Error('Failed to create at_distribution_center status');
    }

    const packageEntity = makePackage({
      status: atDistributionCenterStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: 'non-existent-admin-id',
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });

  it('should not be able to mark as in transit with a non-existent delivery person', async () => {
    const admin = makeAdminPerson();
    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      throw new Error('Failed to create at_distribution_center status');
    }

    const packageEntity = makePackage({
      status: atDistributionCenterStatus.value,
    });

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: 'non-existent-delivery-person-id',
      packageId: packageEntity.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to mark as in transit a non-existent package', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: 'non-existent-package-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to mark as in transit a package not assigned to any delivery person', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      throw new Error('Failed to create at_distribution_center status');
    }

    const packageEntity = makePackage({
      status: atDistributionCenterStatus.value,
      deliveryPersonId: null,
    });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        PackageNotAssignedToDeliveryPersonError
      );
    }
  });

  it('should not be able to mark as in transit a package in invalid status', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({
      deliveryPersonId: deliveryPerson.id,
    });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
  });
});
