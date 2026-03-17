import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { Package } from '../../enterprise/entities/package';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import { DeliveryPersonNotAssignedToPackageError } from './errors/delivery-person-not-assigned-to-package-error';
import { PackageNotAssignedToDeliveryPersonError } from './errors/package-not-assigned-to-delivery-person-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { PackageFailedDeliveryUseCase } from './package-failed-delivery';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: PackageFailedDeliveryUseCase;

describe('Package Failed Delivery', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new PackageFailedDeliveryUseCase(
      packagesRepository,
      deliveryPeopleRepository
    );
  });

  it('should be able to mark a package as failed delivery', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.status.isFailedDelivery()).toBe(true);
    }
  });

  it('should transition package status to failed_delivery', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.status).toBeInstanceOf(PackageStatus);
      expect(result.value.package.status.value).toBe('failed_delivery');
    }
  });

  it('should persist the updated package in the repository', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    const updatedPackage = await packagesRepository.findById(
      packageEntity.id.toString()
    );

    expect(updatedPackage).toBeTruthy();
    expect(updatedPackage?.status.isFailedDelivery()).toBe(true);
  });

  it('should create a package history entry on failed delivery', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const initialHistoryCount = packageEntity.histories.getItems().length;

    const result = await sut.execute({
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
    const deliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const customDescription = 'Recipient not home';

    const result = await sut.execute({
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
    const deliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const histories = result.value.package.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe('Package delivery failed');
    }
  });

  it('should not be able to mark as failed delivery with a non-existent delivery person', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageEntity = makePackage({ status: outForDeliveryStatus.value });

    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: 'non-existent-delivery-person-id',
      packageId: packageEntity.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to mark as failed delivery a non-existent package', async () => {
    const deliveryPerson = makeDeliveryPerson();

    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: 'non-existent-package-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to mark as failed delivery a package not assigned to any delivery person', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: null,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
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

  it('should not be able to mark as failed delivery a package assigned to a different delivery person', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const anotherDeliveryPerson = makeDeliveryPerson();
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: anotherDeliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        DeliveryPersonNotAssignedToPackageError
      );
    }
  });

  it('should not be able to mark as failed delivery a package in invalid status', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
    }
  });
});
