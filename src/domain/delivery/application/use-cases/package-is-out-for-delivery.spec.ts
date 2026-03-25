import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { Package } from '../../enterprise/entities/package';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { PackageIsOutForDeliveryUseCase } from './package-is-out-for-delivery';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: PackageIsOutForDeliveryUseCase;

describe('Package Is Out For Delivery', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new PackageIsOutForDeliveryUseCase(
      adminPeopleRepository,
      deliveryPeopleRepository,
      packagesRepository
    );
  });

  it('should be able to mark a package as out for delivery', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const inTransitStatus = PackageStatus.create('in_transit');

    if (inTransitStatus.isLeft()) {
      throw new Error('Failed to create in_transit status');
    }

    const packageEntity = makePackage({
      status: inTransitStatus.value,
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

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.status.isOutForDelivery()).toBe(true);
    }
  });

  it('should transition package status to out_for_delivery', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const inTransitStatus = PackageStatus.create('in_transit');

    if (inTransitStatus.isLeft()) {
      throw new Error('Failed to create in_transit status');
    }

    const packageEntity = makePackage({
      status: inTransitStatus.value,
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

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.status).toBeInstanceOf(PackageStatus);
      expect(result.value.package.status.value).toBe('out_for_delivery');
    }
  });

  it('should assign the delivery person to the package', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const inTransitStatus = PackageStatus.create('in_transit');

    if (inTransitStatus.isLeft()) {
      throw new Error('Failed to create in_transit status');
    }

    const packageEntity = makePackage({
      status: inTransitStatus.value,
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

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(
        result.value.package.deliveryPersonId?.equals(deliveryPerson.id)
      ).toBe(true);
    }
  });

  it('should persist the updated package in the repository', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const inTransitStatus = PackageStatus.create('in_transit');

    if (inTransitStatus.isLeft()) {
      throw new Error('Failed to create in_transit status');
    }

    const packageEntity = makePackage({
      status: inTransitStatus.value,
      deliveryPersonId: null,
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
    expect(updatedPackage?.status.isOutForDelivery()).toBe(true);
  });

  it('should create a package history entry on marking as out for delivery', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const inTransitStatus = PackageStatus.create('in_transit');

    if (inTransitStatus.isLeft()) {
      throw new Error('Failed to create in_transit status');
    }

    const packageEntity = makePackage({
      status: inTransitStatus.value,
      deliveryPersonId: null,
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
    const inTransitStatus = PackageStatus.create('in_transit');

    if (inTransitStatus.isLeft()) {
      throw new Error('Failed to create in_transit status');
    }

    const packageEntity = makePackage({
      status: inTransitStatus.value,
      deliveryPersonId: null,
    });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const customDescription = 'Out for final delivery';

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
    const inTransitStatus = PackageStatus.create('in_transit');

    if (inTransitStatus.isLeft()) {
      throw new Error('Failed to create in_transit status');
    }

    const packageEntity = makePackage({
      status: inTransitStatus.value,
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

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const histories = result.value.package.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe('Package is out for delivery');
    }
  });

  it('should not be able to mark as out for delivery with a non-existent admin', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const inTransitStatus = PackageStatus.create('in_transit');

    if (inTransitStatus.isLeft()) {
      throw new Error('Failed to create in_transit status');
    }

    const packageEntity = makePackage({
      status: inTransitStatus.value,
      deliveryPersonId: null,
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

  it('should not be able to mark as out for delivery with a non-existent delivery person', async () => {
    const admin = makeAdminPerson();
    const inTransitStatus = PackageStatus.create('in_transit');

    if (inTransitStatus.isLeft()) {
      throw new Error('Failed to create in_transit status');
    }

    const packageEntity = makePackage({
      status: inTransitStatus.value,
      deliveryPersonId: null,
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

  it('should not be able to mark as out for delivery a non-existent package', async () => {
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

  it('should not be able to mark as out for delivery a package in invalid status', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({ deliveryPersonId: null });

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
      expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
    }
  });
});
