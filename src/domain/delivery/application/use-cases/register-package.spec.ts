import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { Package } from '../../enterprise/entities/package';
import { PackageCode } from '../../enterprise/entities/value-object/package-code';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { RegisterPackage } from './register-package';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: RegisterPackage;

describe('Register Package', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();

    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new RegisterPackage(
      packagesRepository,
      deliveryPeopleRepository,
      adminPeopleRepository
    );
  });

  it('should be able to register a new package', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, State',
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.recipientName).toBe('John Doe');
      expect(result.value.package.recipientAddress).toBe(
        '123 Main St, City, State'
      );
      expect(result.value.package.deliveryPersonId?.toString()).toBe(
        deliveryPerson.id.toString()
      );
    }
  });

  it('should be able to register a package without delivery person', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, State',
      deliveryPersonId: null,
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.deliveryPersonId).toBeNull();
    }
  });

  it('should not be able to register a package with non-existent author', async () => {
    const result = await sut.execute({
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, State',
      deliveryPersonId: null,
      authorId: 'non-existent-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to register a package with non-existent delivery person', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, State',
      deliveryPersonId: 'non-existent-id',
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should generate package code upon registration', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, State',
      deliveryPersonId: null,
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.code).toBeInstanceOf(PackageCode);
      expect(result.value.package.code.value).toBeTruthy();
    }
  });

  it('should create package with pending status', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, State',
      deliveryPersonId: null,
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.status).toBeInstanceOf(PackageStatus);
      expect(result.value.package.status.isPending()).toBe(true);
    }
  });

  it('should store package in repository', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    await sut.execute({
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, State',
      deliveryPersonId: null,
      authorId: admin.id.toString(),
    });

    expect(packagesRepository.packages).toHaveLength(1);
    expect(packagesRepository.packages[0].recipientName).toBe('John Doe');
  });

  it('should register multiple packages', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    await sut.execute({
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, State',
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    await sut.execute({
      recipientName: 'Jane Smith',
      recipientAddress: '456 Oak Ave, Town, State',
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(packagesRepository.packages).toHaveLength(2);
    expect(packagesRepository.packages[0].recipientName).toBe('John Doe');
    expect(packagesRepository.packages[1].recipientName).toBe('Jane Smith');
  });

  it('should assign delivery person correctly when provided', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      recipientName: 'John Doe',
      recipientAddress: '123 Main St, City, State',
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.deliveryPersonId).not.toBeNull();
      expect(
        result.value.package.deliveryPersonId?.equals(deliveryPerson.id)
      ).toBe(true);
    }
  });
});
