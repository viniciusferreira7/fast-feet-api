import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { Package } from '../../enterprise/entities/package';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { UpdatePackage } from './update-package';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let sut: UpdatePackage;

describe('Update Package', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    sut = new UpdatePackage(packagesRepository, adminPeopleRepository);
  });

  it('should be able to update a package', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
      name: 'Updated package name',
      recipientAddress: 'Updated address',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.name).toBe('Updated package name');
      expect(result.value.package.recipientAddress).toBe('Updated address');
    }
  });

  it('should update updatedAt after updating a package', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
      name: 'Updated package name',
      recipientAddress: 'Updated address',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should persist the updated package in the repository', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
      name: 'Updated package name',
      recipientAddress: 'Updated address',
    });

    const updatedPackage = await packagesRepository.findById(
      packageEntity.id.toString()
    );

    expect(updatedPackage?.name).toBe('Updated package name');
    expect(updatedPackage?.recipientAddress).toBe('Updated address');
  });

  it('should not be able to update a package with a non-existent admin', async () => {
    const packageEntity = makePackage();

    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: 'non-existent-admin-id',
      packageId: packageEntity.id.toString(),
      name: 'Updated package name',
      recipientAddress: 'Updated address',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });

  it('should not be able to update a non-existent package', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: 'non-existent-package-id',
      name: 'Updated package name',
      recipientAddress: 'Updated address',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should persist description when provided', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
      name: 'New name',
      recipientAddress: 'New address',
      description: 'Fragile item',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.description).toBe('Fragile item');
    }
  });

  it('should not alter the package code or status after updating', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();
    const originalCode = packageEntity.code;
    const originalStatus = packageEntity.status;

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
      name: 'Changed name',
      recipientAddress: 'Changed address',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.code.equals(originalCode)).toBe(true);
      expect(result.value.package.status.value).toBe(originalStatus.value);
    }
  });

  it('should leave description undefined when not provided', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.id.toString(),
      name: 'New name',
      recipientAddress: 'New address',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.description).toBeUndefined();
    }
  });
});
