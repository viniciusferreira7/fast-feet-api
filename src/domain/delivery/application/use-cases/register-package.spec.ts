import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { FakePostCodeValidator } from 'test/validation/fake-post-code-validator';
import { Package } from '../../enterprise/entities/package';
import { PackageCode } from '../../enterprise/entities/value-object/package-code';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { ExternalPostCodeError } from '../../errors/external-post-code-validation-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { RegisterPackage } from './register-package';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let postCodeValidator: FakePostCodeValidator;
let sut: RegisterPackage;

describe('Register Package', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();

    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    postCodeValidator = new FakePostCodeValidator();
    sut = new RegisterPackage(
      packagesRepository,
      deliveryPeopleRepository,
      adminPeopleRepository,
      recipientPeopleRepository,
      postCodeValidator
    );
  });

  it('should be able to register a new package', async () => {
    const admin = makeAdminPerson();
    const recipientPerson = makeRecipientPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await recipientPeopleRepository.register(recipientPerson);
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      recipientId: recipientPerson.id.toString(),
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: '12345-678',
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.recipientId.toString()).toBe(
        recipientPerson.id.toString()
      );
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
    const recipientPerson = makeRecipientPerson();
    await adminPeopleRepository.register(admin);
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      recipientId: recipientPerson.id.toString(),
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: '12345-678',
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
    const recipientPerson = makeRecipientPerson();

    const result = await sut.execute({
      recipientId: recipientPerson.id.toString(),
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: '12345-678',
      deliveryPersonId: null,
      authorId: 'non-existent-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to register a package with non-existent recipient person', async () => {
    const admin = makeAdminPerson();

    const result = await sut.execute({
      recipientId: 'non-existent-id',
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: '12345-678',
      deliveryPersonId: null,
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to register a package with non-existent delivery person', async () => {
    const admin = makeAdminPerson();
    const recipientPerson = makeRecipientPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      recipientId: recipientPerson.id.toString(),
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: '12345-678',
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
    const recipientPerson = makeRecipientPerson();
    await adminPeopleRepository.register(admin);
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      recipientId: recipientPerson.id.toString(),
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: '12345-678',
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
    const recipientPerson = makeRecipientPerson();
    await adminPeopleRepository.register(admin);
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      recipientId: recipientPerson.id.toString(),
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: '12345-678',
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
    const recipientPerson = makeRecipientPerson();
    await adminPeopleRepository.register(admin);
    await recipientPeopleRepository.register(recipientPerson);

    await sut.execute({
      recipientId: recipientPerson.id.toString(),
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: '12345-678',
      deliveryPersonId: null,
      authorId: admin.id.toString(),
    });

    expect(packagesRepository.packages).toHaveLength(1);
    expect(packagesRepository.packages[0].recipientId.toString()).toBe(
      recipientPerson.id.toString()
    );
  });

  it('should register multiple packages', async () => {
    const admin = makeAdminPerson();
    const recipientPerson = makeRecipientPerson();
    const recipientPerson2 = makeRecipientPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await recipientPeopleRepository.register(recipientPerson);
    await recipientPeopleRepository.register(recipientPerson2);
    await deliveryPeopleRepository.register(deliveryPerson);

    await sut.execute({
      recipientId: recipientPerson.id.toString(),
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: '12345-678',
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    await sut.execute({
      recipientId: recipientPerson2.id.toString(),
      name: 'Package',
      recipientAddress: '456 Oak Ave, Town, State',
      postCode: '98765-432',
      deliveryPersonId: deliveryPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(packagesRepository.packages).toHaveLength(2);
    expect(packagesRepository.packages[0].recipientId.toString()).toBe(
      recipientPerson.id.toString()
    );
    expect(packagesRepository.packages[1].recipientId.toString()).toBe(
      recipientPerson2.id.toString()
    );
  });

  it('should assign delivery person correctly when provided', async () => {
    const admin = makeAdminPerson();
    const recipientPerson = makeRecipientPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await recipientPeopleRepository.register(recipientPerson);
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      recipientId: recipientPerson.id.toString(),
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: '12345-678',
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

  it('should not be able to register a package with invalid post code', async () => {
    const admin = makeAdminPerson();
    const recipientPerson = makeRecipientPerson();
    await adminPeopleRepository.register(admin);
    await recipientPeopleRepository.register(recipientPerson);

    const invalidPostCodeValidator = new FakePostCodeValidator();
    vi.spyOn(invalidPostCodeValidator, 'validate').mockResolvedValue(false);

    const registerPackageWithInvalidValidator = new RegisterPackage(
      packagesRepository,
      deliveryPeopleRepository,
      adminPeopleRepository,
      recipientPeopleRepository,
      invalidPostCodeValidator
    );

    const result = await registerPackageWithInvalidValidator.execute({
      recipientId: recipientPerson.id.toString(),
      name: 'Package',
      recipientAddress: '123 Main St, City, State',
      postCode: 'invalid-post-code',
      deliveryPersonId: null,
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ExternalPostCodeError);
    }
  });
});
