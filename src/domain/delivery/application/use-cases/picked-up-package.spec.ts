import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { Package } from '../../enterprise/entities/package';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { PackageAlreadyAssignedError } from './errors/package-already-assined-erro';
import { PackageNotAssignedToDeliveryPersonError } from './errors/package-not-assigned-to-delivery-person-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { PickUpPackageUseCase } from './picked-up-package';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: PickUpPackageUseCase;

describe('Pick Up Package', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new PickUpPackageUseCase(packagesRepository, deliveryPeopleRepository);
  });

  it('should be able to pick up a package', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageEntity = makePackage({
      status: awaitingPickupStatus.value,
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

  it('should transition package status to picked_up', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageEntity = makePackage({
      status: awaitingPickupStatus.value,
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
      expect(result.value.package.status).toBeInstanceOf(PackageStatus);
      expect(result.value.package.status.isPickedUp()).toBe(true);
    }
  });

  it('should create a package history entry on pick up', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageEntity = makePackage({
      status: awaitingPickupStatus.value,
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

  it('should persist the picked up package in the repository', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageEntity = makePackage({
      status: awaitingPickupStatus.value,
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
    expect(updatedPackage?.status.isPickedUp()).toBe(true);
  });

  it('should not be able to pick up a non-existent package', async () => {
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

  it('should not be able to pick up with a non-existent delivery person', async () => {
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageEntity = makePackage({ status: awaitingPickupStatus.value });

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

  it('should not be able to pick up a package not assigned to any delivery person', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageEntity = makePackage({
      status: awaitingPickupStatus.value,
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
      expect(result.value).toBeInstanceOf(PackageNotAssignedToDeliveryPersonError);
    }
  });

  it('should not be able to pick up a package assigned to a different delivery person', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const anotherDeliveryPerson = makeDeliveryPerson();
    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      throw new Error('Failed to create awaiting_pickup status');
    }

    const packageEntity = makePackage({
      status: awaitingPickupStatus.value,
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
      expect(result.value).toBeInstanceOf(PackageAlreadyAssignedError);
    }
  });

  it('should not be able to pick up a package in invalid status', async () => {
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
