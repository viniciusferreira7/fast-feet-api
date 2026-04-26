import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makeModuleRef } from 'test/factories/make-module-ref';
import { makePackage } from 'test/factories/make-package';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { AdminPeopleRepository } from '@/domain/delivery/application/repositories/admin-people-repository';
import { DeliveryPeopleRepository } from '@/domain/delivery/application/repositories/delivery-people-repository';
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { RecipientPeopleRepository } from '@/domain/delivery/application/repositories/recipient-people-repository';
import { PackageDetails } from '@/domain/delivery/enterprise/entities/value-object/package-details';
import { PackageHistoryList } from '@/domain/delivery/enterprise/entities/value-object/package-history-list';
import { DrizzlePackagesRepository } from './drizzle-packages-repository';

let app: INestApplication;
let repository: DrizzlePackagesRepository;
let adminRepository: AdminPeopleRepository;
let recipientRepository: RecipientPeopleRepository;
let deliveryRepository: DeliveryPeopleRepository;

describe('DrizzlePackagesRepository', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = moduleRef.createNestApplication();
    repository = moduleRef.get(PackagesRepository);
    adminRepository = moduleRef.get(AdminPeopleRepository);
    recipientRepository = moduleRef.get(RecipientPeopleRepository);
    deliveryRepository = moduleRef.get(DeliveryPeopleRepository);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function seedUsers() {
    const author = makeAdminPerson({ emailVerification: null });
    const recipient = makeRecipientPerson({ emailVerification: null });
    const deliveryPerson = makeDeliveryPerson({ emailVerification: null });
    await adminRepository.register(author);
    await recipientRepository.register(recipient);
    await deliveryRepository.register(deliveryPerson);

    return { author, recipient, deliveryPerson };
  }

  describe('register', () => {
    it('should register a package and return the domain entity', async () => {
      const { author, recipient } = await seedUsers();

      const pkg = makePackage({
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: null,
        histories: new PackageHistoryList([]),
      });

      const result = await repository.register(pkg);

      expect(result.id.toString()).toEqual(pkg.id.toString());
      expect(result.name).toEqual(pkg.name);
      expect(result.code.value).toEqual(pkg.code.value);
    });
  });

  describe('findById', () => {
    it('should return null when id does not exist', async () => {
      const result = await repository.findById(randomUUID());

      expect(result).toBeNull();
    });

    it('should return package by id with histories', async () => {
      const { author, recipient } = await seedUsers();

      const pkg = makePackage({
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: null,
        histories: new PackageHistoryList([]),
      });
      await repository.register(pkg);

      const result = await repository.findById(pkg.id.toString());

      expect(result).not.toBeNull();
      expect(result?.code.value).toEqual(pkg.code.value);
    });
  });

  describe('findByCode', () => {
    it('should return null when code does not exist', async () => {
      const result = await repository.findByCode('NONEXISTENTCODE00000000000');

      expect(result).toBeNull();
    });

    it('should return package by code', async () => {
      const { author, recipient } = await seedUsers();

      const pkg = makePackage({
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: null,
        histories: new PackageHistoryList([]),
      });
      await repository.register(pkg);

      const result = await repository.findByCode(pkg.code.value);

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(pkg.id.toString());
    });
  });

  describe('update', () => {
    it('should return null when package does not exist', async () => {
      const { author, recipient } = await seedUsers();

      const pkg = makePackage({
        id: new UniqueEntityId(randomUUID()),
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: null,
        histories: new PackageHistoryList([]),
      });

      const result = await repository.update(pkg);

      expect(result).toBeNull();
    });

    it('should update package fields and increment version', async () => {
      const { author, recipient } = await seedUsers();

      const pkg = makePackage({
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: null,
        histories: new PackageHistoryList([]),
      });
      await repository.register(pkg);

      pkg.update({
        name: 'Updated Name',
        recipientAddress: pkg.recipientAddress,
      });
      const result = await repository.update(pkg);

      expect(result).not.toBeNull();
      expect(result?.name).toEqual('Updated Name');
    });
  });

  describe('findNearBy', () => {
    it('should return packages near the given postal code', async () => {
      const { author, recipient } = await seedUsers();

      const nearby = makePackage({
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: null,
        histories: new PackageHistoryList([]),
      });
      await repository.register(nearby);

      const result = await repository.findNearBy({
        postalCode: nearby.postalCode,
        page: 1,
        perPage: 10,
      });

      expect(result.result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('findDetailsById', () => {
    it('should return null when id does not exist', async () => {
      const result = await repository.findDetailsById(randomUUID());

      expect(result).toBeNull();
    });

    it('should return PackageDetails with embedded recipient and author', async () => {
      const { author, recipient } = await seedUsers();

      const pkg = makePackage({
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: null,
        histories: new PackageHistoryList([]),
      });
      await repository.register(pkg);

      const result = await repository.findDetailsById(pkg.id.toString());

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(PackageDetails);
      expect(result?.packageId.toString()).toEqual(pkg.id.toString());
      expect(result?.recipient.name).toEqual(recipient.name);
      expect(result?.author.name).toEqual(author.name);
      expect(result?.deliveryPerson).toBeNull();
    });
  });

  describe('findDetailsByCode', () => {
    it('should return null when code does not exist', async () => {
      const result = await repository.findDetailsByCode(
        'NONEXISTENTCODE00000000000'
      );

      expect(result).toBeNull();
    });

    it('should return PackageDetails with embedded recipient, author and delivery person', async () => {
      const { author, recipient, deliveryPerson } = await seedUsers();

      const pkg = makePackage({
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: deliveryPerson.id,
        histories: new PackageHistoryList([]),
      });
      await repository.register(pkg);

      const result = await repository.findDetailsByCode(pkg.code.value);

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(PackageDetails);
      expect(result?.packageId.toString()).toEqual(pkg.id.toString());
      expect(result?.recipient.name).toEqual(recipient.name);
      expect(result?.author.name).toEqual(author.name);
      expect(result?.deliveryPerson?.name).toEqual(deliveryPerson.name);
      expect(result?.attachment).toBeNull();
      expect(result?.histories).toHaveLength(0);
    });

    it('should return PackageDetails without delivery person when not assigned', async () => {
      const { author, recipient } = await seedUsers();

      const pkg = makePackage({
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: null,
        histories: new PackageHistoryList([]),
      });
      await repository.register(pkg);

      const result = await repository.findDetailsByCode(pkg.code.value);

      expect(result?.deliveryPerson).toBeNull();
    });
  });

  describe('findByDeliveryPersonId', () => {
    it('should return packages assigned to a delivery person with matching status', async () => {
      const { author, recipient, deliveryPerson } = await seedUsers();

      const pkg = makePackage({
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: deliveryPerson.id,
        histories: new PackageHistoryList([]),
      });
      await repository.register(pkg);

      const result = await repository.findByDeliveryPersonId(
        deliveryPerson.id.toString(),
        ['pending']
      );

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(
        result.every((p) => p.deliveryPersonId?.equals(deliveryPerson.id))
      ).toBe(true);
    });

    it('should return empty array when no matching status', async () => {
      const { author, recipient, deliveryPerson } = await seedUsers();

      const pkg = makePackage({
        authorId: author.id,
        recipientId: recipient.id,
        deliveryPersonId: deliveryPerson.id,
        histories: new PackageHistoryList([]),
      });
      await repository.register(pkg);

      const result = await repository.findByDeliveryPersonId(
        deliveryPerson.id.toString(),
        ['delivered']
      );

      expect(result).toHaveLength(0);
    });
  });
});
