import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { Package } from '../../enterprise/entities/package';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { CancelPackageUseCase } from './cancel-package';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { PackageAlreadyCanceledErrorError } from './errors/package-already-canceled-error';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let sut: CancelPackageUseCase;

describe('Cancel Package', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    sut = new CancelPackageUseCase(packagesRepository, adminPeopleRepository);
  });

  it('should be able to cancel a package', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.status.isCanceled()).toBe(true);
    }
  });

  it('should set package status to canceled', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.status).toBeInstanceOf(PackageStatus);
      expect(result.value.package.status.value).toBe('canceled');
    }
  });

  it('should create a package history entry on cancel', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const initialHistoryCount = packageEntity.histories.getItems().length;

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.histories.getItems().length).toBe(
        initialHistoryCount + 1
      );
    }
  });

  it('should be able to cancel a package with custom description', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const customDescription = 'Canceled due to recipient request';

    const result = await sut.execute({
      authorId: admin.id.toString(),
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

  it('should persist the canceled package in the repository', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    const updatedPackage = await packagesRepository.findById(
      packageEntity.id.toString()
    );

    expect(updatedPackage).toBeTruthy();
    expect(updatedPackage?.status.isCanceled()).toBe(true);
  });

  it('should not be able to cancel a package with a non-existent admin', async () => {
    const packageEntity = makePackage();

    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: 'non-existent-admin-id',
      packageId: packageEntity.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });

  it('should not be able to cancel a non-existent package', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: 'non-existent-package-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to cancel an already canceled package', async () => {
    const admin = makeAdminPerson();
    const canceledStatus = PackageStatus.create('canceled');

    if (canceledStatus.isLeft()) {
      throw new Error('Failed to create canceled status');
    }

    const packageEntity = makePackage({ status: canceledStatus.value });

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(PackageAlreadyCanceledErrorError);
    }
  });

  it('should not be able to cancel a delivered package', async () => {
    const admin = makeAdminPerson();
    const deliveredStatus = PackageStatus.create('delivered');

    if (deliveredStatus.isLeft()) {
      throw new Error('Failed to create delivered status');
    }

    const packageEntity = makePackage({ status: deliveredStatus.value });

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
  });
});
