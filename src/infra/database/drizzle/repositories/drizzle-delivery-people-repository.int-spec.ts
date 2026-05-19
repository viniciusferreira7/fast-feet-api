import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { DeliveryPeopleRepository } from '@/domain/delivery/application/repositories/delivery-people-repository';
import { DrizzleService } from '../drizzle.service';
import { deliveryProfiles, users } from '../schema';
import { DrizzleDeliveryPeopleRepository } from './drizzle-delivery-people-repository';

let app: INestApplication;
let repository: DrizzleDeliveryPeopleRepository;
let drizzleService: DrizzleService;

describe('DrizzleDeliveryPeopleRepository', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    repository = moduleRef.get(DeliveryPeopleRepository);
    drizzleService = moduleRef.get(DrizzleService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('register', () => {
    it('should register a delivery person and return the domain entity', async () => {
      const deliveryPerson = makeDeliveryPerson({ emailVerification: null });

      const result = await repository.register(deliveryPerson);

      expect(result.id.toString()).toEqual(deliveryPerson.id.toString());
      expect(result.name).toEqual(deliveryPerson.name);
      expect(result.email).toEqual(deliveryPerson.email);
      expect(result.cpf.value).toEqual(deliveryPerson.cpf.value);
      expect(result.isActive).toBe(true);
    });

    it('should persist the user and delivery profile in the database', async () => {
      const deliveryPerson = makeDeliveryPerson({ emailVerification: null });

      await repository.register(deliveryPerson);

      const [persistedUser] = await drizzleService.db
        .select()
        .from(users)
        .where(eq(users.id, deliveryPerson.id.toString()));

      const [persistedProfile] = await drizzleService.db
        .select()
        .from(deliveryProfiles)
        .where(eq(deliveryProfiles.userId, deliveryPerson.id.toString()));

      expect(persistedUser).toBeDefined();
      expect(persistedUser.role).toEqual('DELIVERY');
      expect(persistedUser.version).toEqual(1);
      expect(persistedProfile).toBeDefined();
      expect(persistedProfile.isActive).toBe(true);
      expect(persistedProfile.version).toEqual(1);
    });
  });

  describe('findByCpf', () => {
    it('should return null when cpf does not exist', async () => {
      const result = await repository.findByCpf('00000000000');

      expect(result).toBeNull();
    });

    it('should return delivery person by cpf', async () => {
      const deliveryPerson = makeDeliveryPerson({ emailVerification: null });
      await repository.register(deliveryPerson);

      const result = await repository.findByCpf(deliveryPerson.cpf.value);

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(deliveryPerson.id.toString());
      expect(result?.email).toEqual(deliveryPerson.email);
      expect(result?.isActive).toBe(true);
    });
  });

  describe('findByEmail', () => {
    it('should return null when email does not exist', async () => {
      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should return delivery person by email', async () => {
      const deliveryPerson = makeDeliveryPerson({ emailVerification: null });
      await repository.register(deliveryPerson);

      const result = await repository.findByEmail(deliveryPerson.email);

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(deliveryPerson.id.toString());
      expect(result?.cpf.value).toEqual(deliveryPerson.cpf.value);
    });
  });

  describe('findById', () => {
    it('should return null when id does not exist', async () => {
      const result = await repository.findById(randomUUID());

      expect(result).toBeNull();
    });

    it('should return delivery person by id', async () => {
      const deliveryPerson = makeDeliveryPerson({ emailVerification: null });
      await repository.register(deliveryPerson);

      const result = await repository.findById(deliveryPerson.id.toString());

      expect(result).not.toBeNull();
      expect(result?.email).toEqual(deliveryPerson.email);
      expect(result?.cpf.value).toEqual(deliveryPerson.cpf.value);
    });
  });

  describe('findManyDeliveryPerson', () => {
    it('should return empty pagination when no delivery people exist', async () => {
      const result = await repository.findManyDeliveryPerson({
        page: 1,
        perPage: 10,
      });

      expect(result.result).toHaveLength(0);
      expect(result.totalPages).toBe(0);
    });

    it('should return paginated delivery people', async () => {
      const dp1 = makeDeliveryPerson({ emailVerification: null });
      const dp2 = makeDeliveryPerson({ emailVerification: null });
      const dp3 = makeDeliveryPerson({ emailVerification: null });

      await Promise.all([
        repository.register(dp1),
        repository.register(dp2),
        repository.register(dp3),
      ]);

      const result = await repository.findManyDeliveryPerson({
        page: 1,
        perPage: 2,
      });

      expect(result.result).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should filter by name', async () => {
      const dp = makeDeliveryPerson({
        emailVerification: null,
        name: 'Unique Rider',
      });
      const other = makeDeliveryPerson({ emailVerification: null });

      await Promise.all([repository.register(dp), repository.register(other)]);

      const result = await repository.findManyDeliveryPerson({
        name: 'Unique',
      });

      expect(result.result).toHaveLength(1);
      expect(result.result[0].name).toBe('Unique Rider');
    });

    it('should filter by isActive', async () => {
      const active = makeDeliveryPerson({
        emailVerification: null,
        isActive: true,
      });
      const inactive = makeDeliveryPerson({
        emailVerification: null,
        isActive: false,
      });

      await Promise.all([
        repository.register(active),
        repository.register(inactive),
      ]);

      const activeResult = await repository.findManyDeliveryPerson({
        isActive: true,
      });
      const inactiveResult = await repository.findManyDeliveryPerson({
        isActive: false,
      });

      expect(activeResult.result.every((dp) => dp.isActive)).toBe(true);
      expect(inactiveResult.result.every((dp) => !dp.isActive)).toBe(true);
    });

    it('should filter by search across name, email and cpf', async () => {
      const dp = makeDeliveryPerson({
        emailVerification: null,
        name: 'SearchableName',
      });
      const other = makeDeliveryPerson({ emailVerification: null });

      await Promise.all([repository.register(dp), repository.register(other)]);

      const result = await repository.findManyDeliveryPerson({
        search: 'SearchableName',
      });

      expect(result.result).toHaveLength(1);
      expect(result.result[0].id.toString()).toBe(dp.id.toString());
    });
  });

  describe('update', () => {
    it('should return null when delivery person does not exist', async () => {
      const deliveryPerson = makeDeliveryPerson({ emailVerification: null });

      const result = await repository.update(deliveryPerson);

      expect(result).toBeNull();
    });

    it('should update delivery person name', async () => {
      const deliveryPerson = makeDeliveryPerson({ emailVerification: null });
      await repository.register(deliveryPerson);

      deliveryPerson.updateName('Updated Name');
      const result = await repository.update(deliveryPerson);

      expect(result).not.toBeNull();
      expect(result?.name).toEqual('Updated Name');
    });

    it('should increment version on each update', async () => {
      const deliveryPerson = makeDeliveryPerson({ emailVerification: null });
      await repository.register(deliveryPerson);

      await repository.update(deliveryPerson);

      const [persistedUser] = await drizzleService.db
        .select()
        .from(users)
        .where(eq(users.id, deliveryPerson.id.toString()));

      const [persistedProfile] = await drizzleService.db
        .select()
        .from(deliveryProfiles)
        .where(eq(deliveryProfiles.userId, deliveryPerson.id.toString()));

      expect(persistedUser.version).toBe(2);
      expect(persistedProfile.version).toBe(2);
    });

    it('should persist isActive false when delivery person is disabled', async () => {
      const deliveryPerson = makeDeliveryPerson({ emailVerification: null });
      await repository.register(deliveryPerson);

      deliveryPerson.disableProfile();
      await repository.update(deliveryPerson);

      const [persistedProfile] = await drizzleService.db
        .select()
        .from(deliveryProfiles)
        .where(eq(deliveryProfiles.userId, deliveryPerson.id.toString()));

      expect(persistedProfile.isActive).toBe(false);
    });
  });
});
