import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { Package } from '../../enterprise/entities/package';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { DropOffPackageAtDistributionCenterUseCase } from './drop-off-package-at-distribution-center';
import { DeliveryPersonNotAssignedToPackageError } from './errors/delivery-person-not-assigned-to-package-error';
import { PackageNotAssignedToDeliveryPersonError } from './errors/package-not-assigned-to-delivery-person-error';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: DropOffPackageAtDistributionCenterUseCase;

describe('Drop Off Package At Distribution Center', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new DropOffPackageAtDistributionCenterUseCase(
      packagesRepository,
      deliveryPeopleRepository
    );
  });

  it('should be able to drop off a package at a distribution center', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageEntity = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
    }
  });

  it('should transition package status to at_distribution_center', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageEntity = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.status.isAtDistributionCenter()).toBe(true);
    }
  });

  it('should persist the updated package in the repository', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageEntity = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
    });

    const updatedPackage = await packagesRepository.findById(
      packageEntity.id.toString()
    );

    expect(updatedPackage).toBeTruthy();
    expect(updatedPackage?.status.isAtDistributionCenter()).toBe(true);
  });

  it('should create a package history entry on drop off', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageEntity = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const initialHistoryCount = packageEntity.histories.getItems().length;

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.histories.getItems().length).toBe(
        initialHistoryCount + 1
      );
    }
  });

  it('should store custom description in history when provided', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageEntity = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const customDescription = 'Dropped off at central hub';

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
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
    const deliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageEntity = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const histories = result.value.package.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe(
        'Package marked at distribution center'
      );
    }
  });

  it('should not be able to drop off a non-existent package', async () => {
    const deliveryPerson = makeDeliveryPerson();

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      packageId: 'non-existent-package-id',
      deliveryPersonId: deliveryPerson.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to drop off with a non-existent delivery person', async () => {
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageEntity = makePackage({ status: pickedUpStatus.value });

    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: 'non-existent-delivery-person-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to drop off a package not assigned to any delivery person', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageEntity = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: null,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        PackageNotAssignedToDeliveryPersonError
      );
    }
  });

  it('should not be able to drop off a package assigned to a different delivery person', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const anotherDeliveryPerson = makeDeliveryPerson();
    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      throw new Error('Failed to create picked_up status');
    }

    const packageEntity = makePackage({
      status: pickedUpStatus.value,
      deliveryPersonId: anotherDeliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        DeliveryPersonNotAssignedToPackageError
      );
    }
  });

  it('should not be able to drop off a package in invalid status', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
  });
});
