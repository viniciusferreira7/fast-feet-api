import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { PackageHistory } from '../../enterprise/entities/package-history';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { RegisterPackageHistoryUseCase } from './register-package-history';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: RegisterPackageHistoryUseCase;

describe('Register Package History', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new RegisterPackageHistoryUseCase(
      packagesRepository,
      packageHistoryRepository,
      adminPeopleRepository,
      deliveryPeopleRepository
    );
  });

  it('should be able to register package history', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const fromStatusResult = PackageStatus.create('pending');
    const toStatusResult = PackageStatus.create('awaiting_pickup');

    if (fromStatusResult.isLeft() || toStatusResult.isLeft()) {
      throw new Error('Failed to create status for test');
    }

    const result = await sut.execute({
      packageHistoryData: {
        packageId: packageEntity.id,
        authorId: admin.id,
        deliveryPersonId: deliveryPerson.id,
        fromStatus: fromStatusResult.value,
        toStatus: toStatusResult.value,
        description: 'Package status updated',
        createdAt: new Date(),
      },
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packageHistory).toBeInstanceOf(PackageHistory);
      expect(result.value.packageHistory.packageId).toEqual(packageEntity.id);
      expect(result.value.packageHistory.authorId).toEqual(admin.id);
    }
  });

  it('should be able to register package history without delivery person', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const fromStatusResult = PackageStatus.create('pending');
    const toStatusResult = PackageStatus.create('canceled');

    if (fromStatusResult.isLeft() || toStatusResult.isLeft()) {
      throw new Error('Failed to create status for test');
    }

    const result = await sut.execute({
      packageHistoryData: {
        packageId: packageEntity.id,
        authorId: admin.id,
        deliveryPersonId: null,
        fromStatus: fromStatusResult.value,
        toStatus: toStatusResult.value,
        description: 'Package canceled',
        createdAt: new Date(),
      },
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packageHistory).toBeInstanceOf(PackageHistory);
      expect(result.value.packageHistory.deliveryPersonId).toBeNull();
    }
  });

  it('should store package history in repository', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const fromStatusResult = PackageStatus.create('pending');
    const toStatusResult = PackageStatus.create('awaiting_pickup');

    if (fromStatusResult.isLeft() || toStatusResult.isLeft()) {
      throw new Error('Failed to create status for test');
    }

    await sut.execute({
      packageHistoryData: {
        packageId: packageEntity.id,
        authorId: admin.id,
        deliveryPersonId: null,
        fromStatus: fromStatusResult.value,
        toStatus: toStatusResult.value,
        description: 'Package status updated',
        createdAt: new Date(),
      },
    });

    expect(packageHistoryRepository.packagesHistory).toHaveLength(1);
  });

  it('should not be able to register package history with non-existent admin', async () => {
    const packageEntity = makePackage();

    await packagesRepository.register(packageEntity);

    const fromStatusResult = PackageStatus.create('pending');
    const toStatusResult = PackageStatus.create('awaiting_pickup');

    if (fromStatusResult.isLeft() || toStatusResult.isLeft()) {
      throw new Error('Failed to create status for test');
    }

    const result = await sut.execute({
      packageHistoryData: {
        packageId: packageEntity.id,
        authorId: new UniqueEntityId('non-existent-admin-id'),
        deliveryPersonId: null,
        fromStatus: fromStatusResult.value,
        toStatus: toStatusResult.value,
        description: 'Package status updated',
        createdAt: new Date(),
      },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to register package history with non-existent package', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);

    const fromStatusResult = PackageStatus.create('pending');
    const toStatusResult = PackageStatus.create('awaiting_pickup');

    if (fromStatusResult.isLeft() || toStatusResult.isLeft()) {
      throw new Error('Failed to create status for test');
    }

    const result = await sut.execute({
      packageHistoryData: {
        packageId: new UniqueEntityId('non-existent-package-id'),
        authorId: admin.id,
        deliveryPersonId: null,
        fromStatus: fromStatusResult.value,
        toStatus: toStatusResult.value,
        description: 'Package status updated',
        createdAt: new Date(),
      },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to register package history with non-existent delivery person', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const fromStatusResult = PackageStatus.create('pending');
    const toStatusResult = PackageStatus.create('awaiting_pickup');

    if (fromStatusResult.isLeft() || toStatusResult.isLeft()) {
      throw new Error('Failed to create status for test');
    }

    const result = await sut.execute({
      packageHistoryData: {
        packageId: packageEntity.id,
        authorId: admin.id,
        deliveryPersonId: new UniqueEntityId('non-existent-delivery-person-id'),
        fromStatus: fromStatusResult.value,
        toStatus: toStatusResult.value,
        description: 'Package status updated',
        createdAt: new Date(),
      },
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should register package history with custom description', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const fromStatusResult = PackageStatus.create('pending');
    const toStatusResult = PackageStatus.create('awaiting_pickup');

    if (fromStatusResult.isLeft() || toStatusResult.isLeft()) {
      throw new Error('Failed to create status for test');
    }

    const customDescription = 'Custom history entry for audit purposes';

    const result = await sut.execute({
      packageHistoryData: {
        packageId: packageEntity.id,
        authorId: admin.id,
        deliveryPersonId: null,
        fromStatus: fromStatusResult.value,
        toStatus: toStatusResult.value,
        description: customDescription,
        createdAt: new Date(),
      },
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packageHistory.description).toBe(customDescription);
    }
  });

  it('should register multiple package history entries', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const pendingStatus = PackageStatus.create('pending');
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (
      pendingStatus.isLeft() ||
      awaitingPickupStatus.isLeft() ||
      pickedUpStatus.isLeft()
    ) {
      throw new Error('Failed to create status for test');
    }

    await sut.execute({
      packageHistoryData: {
        packageId: packageEntity.id,
        authorId: admin.id,
        deliveryPersonId: null,
        fromStatus: pendingStatus.value,
        toStatus: awaitingPickupStatus.value,
        description: 'First history entry',
        createdAt: new Date(),
      },
    });

    await sut.execute({
      packageHistoryData: {
        packageId: packageEntity.id,
        authorId: admin.id,
        deliveryPersonId: null,
        fromStatus: awaitingPickupStatus.value,
        toStatus: pickedUpStatus.value,
        description: 'Second history entry',
        createdAt: new Date(),
      },
    });

    expect(packageHistoryRepository.packagesHistory).toHaveLength(2);
  });
});
