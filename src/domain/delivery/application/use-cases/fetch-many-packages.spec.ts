import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { Pagination } from '@/core/entities/value-object/pagination';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { PostalCode } from '../../enterprise/entities/value-object/postal-code';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { FetchManyPackagesUseCase } from './fetch-many-packages';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let sut: FetchManyPackagesUseCase;

describe('Fetch Many Packages', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    sut = new FetchManyPackagesUseCase(
      packagesRepository,
      adminPeopleRepository
    );
  });

  it('should be able to fetch packages as an admin', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(makePackage());
    await packagesRepository.register(makePackage());

    const result = await sut.execute({ authorId: admin.id.toString() });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages).toBeInstanceOf(Pagination);
      expect(result.value.packages.result).toHaveLength(2);
    }
  });

  it('should return an empty list when no packages exist', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);

    const result = await sut.execute({ authorId: admin.id.toString() });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(0);
    }
  });

  it('should respect pagination params', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);

    for (let i = 0; i < 5; i++) {
      await packagesRepository.register(makePackage());
    }

    const result = await sut.execute({
      authorId: admin.id.toString(),
      page: 1,
      perPage: 3,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(3);
      expect(result.value.packages.page).toBe(1);
      expect(result.value.packages.perPage).toBe(3);
    }
  });

  it('should return next page correctly', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);

    for (let i = 0; i < 5; i++) {
      await packagesRepository.register(makePackage());
    }

    const result = await sut.execute({
      authorId: admin.id.toString(),
      page: 2,
      perPage: 3,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(2);
      expect(result.value.packages.page).toBe(2);
    }
  });

  it('should filter by search term across name, code and recipientAddress', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(
      makePackage({ name: 'Electronics Box', recipientAddress: '123 Main St' })
    );
    await packagesRepository.register(
      makePackage({ name: 'Clothing', recipientAddress: 'electronics avenue' })
    );
    await packagesRepository.register(
      makePackage({ name: 'Books', recipientAddress: '456 Other St' })
    );

    const result = await sut.execute({
      authorId: admin.id.toString(),
      search: 'electronics',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(2);
    }
  });

  it('should filter by name', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(makePackage({ name: 'Fragile Glass' }));
    await packagesRepository.register(makePackage({ name: 'Heavy Books' }));

    const result = await sut.execute({
      authorId: admin.id.toString(),
      name: 'fragile',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(1);
      expect(result.value.packages.result[0].name).toBe('Fragile Glass');
    }
  });

  it('should filter by code', async () => {
    const admin = makeAdminPerson();
    const targetPackage = makePackage();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(targetPackage);
    await packagesRepository.register(makePackage());

    const result = await sut.execute({
      authorId: admin.id.toString(),
      code: targetPackage.code.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(1);
      expect(
        result.value.packages.result[0].code.equals(targetPackage.code)
      ).toBe(true);
    }
  });

  it('should filter by recipientAddress', async () => {
    const admin = makeAdminPerson();

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(
      makePackage({ recipientAddress: '42 Elm Street, Springfield' })
    );
    await packagesRepository.register(
      makePackage({ recipientAddress: '99 Oak Avenue, Shelbyville' })
    );

    const result = await sut.execute({
      authorId: admin.id.toString(),
      recipientAddress: 'elm',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(1);
      expect(result.value.packages.result[0].recipientAddress).toBe(
        '42 Elm Street, Springfield'
      );
    }
  });

  it('should filter by status', async () => {
    const admin = makeAdminPerson();
    const canceledStatusResult = PackageStatus.create('canceled');

    if (canceledStatusResult.isLeft()) {
      throw new Error('Failed to create canceled status');
    }

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(makePackage());
    await packagesRepository.register(
      makePackage({ status: canceledStatusResult.value })
    );

    const result = await sut.execute({
      authorId: admin.id.toString(),
      status: 'canceled',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(1);
      expect(result.value.packages.result[0].status.value).toBe('canceled');
    }
  });

  it('should filter by postalCode', async () => {
    const admin = makeAdminPerson();
    const otherPostalCodeResult = PostalCode.create({ value: '99999-000' });

    if (otherPostalCodeResult.isLeft()) {
      throw new Error('Failed to create postal code');
    }

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(makePackage());
    await packagesRepository.register(
      makePackage({ postalCode: otherPostalCodeResult.value })
    );

    const result = await sut.execute({
      authorId: admin.id.toString(),
      postalCode: '12345',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(1);
      expect(result.value.packages.result[0].postalCode.value).toBe(
        '12345-678'
      );
    }
  });

  it('should filter by createdAtGte', async () => {
    const admin = makeAdminPerson();
    const past = new Date('2024-01-01');
    const recent = new Date('2025-01-01');
    const threshold = new Date('2024-06-01');

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(makePackage({ createdAt: past }));
    await packagesRepository.register(makePackage({ createdAt: recent }));

    const result = await sut.execute({
      authorId: admin.id.toString(),
      createdAtGte: threshold,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(1);
      expect(result.value.packages.result[0].createdAt).toEqual(recent);
    }
  });

  it('should filter by updatedAtGte', async () => {
    const admin = makeAdminPerson();
    const past = new Date('2024-01-01');
    const recent = new Date('2025-01-01');
    const threshold = new Date('2024-06-01');

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(makePackage({ updatedAt: past }));
    await packagesRepository.register(makePackage({ updatedAt: recent }));
    await packagesRepository.register(makePackage());

    const result = await sut.execute({
      authorId: admin.id.toString(),
      updatedAtGte: threshold,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(1);
      expect(result.value.packages.result[0].updatedAt).toEqual(recent);
    }
  });

  it('should filter by deliveredAtGte', async () => {
    const admin = makeAdminPerson();
    const past = new Date('2024-01-01');
    const recent = new Date('2025-01-01');
    const threshold = new Date('2024-06-01');

    await adminPeopleRepository.register(admin);
    await packagesRepository.register(makePackage({ deliveredAt: past }));
    await packagesRepository.register(makePackage({ deliveredAt: recent }));
    await packagesRepository.register(makePackage());

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveredAtGte: threshold,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(1);
      expect(result.value.packages.result[0].deliveredAt).toEqual(recent);
    }
  });

  it('should not be able to fetch packages with non-existent admin', async () => {
    const result = await sut.execute({ authorId: 'non-existent-admin-id' });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });
});
