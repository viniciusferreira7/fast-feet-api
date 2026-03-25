import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { Package } from '../../enterprise/entities/package';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { GetByPackageByCodeUseCase } from './get-package-by-code';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let sut: GetByPackageByCodeUseCase;

describe('Get Package By Code', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    sut = new GetByPackageByCodeUseCase(
      packagesRepository,
      adminPeopleRepository
    );
  });

  it('should be able to get a package by code', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.code.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.id.equals(packageEntity.id)).toBe(true);
    }
  });

  it('should return the correct package data', async () => {
    const admin = makeAdminPerson();
    const packageEntity = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: packageEntity.code.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.name).toBe(packageEntity.name);
      expect(result.value.package.code.equals(packageEntity.code)).toBe(true);
    }
  });

  it('should not be able to get a package with a non-existent admin', async () => {
    const packageEntity = makePackage();

    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      authorId: 'non-existent-admin-id',
      packageId: packageEntity.code.value,
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });

  it('should not be able to get a package with a non-existent code', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      packageId: '01AAAAAAAAAAAAAAAAAAAAAAAAA',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });
});
