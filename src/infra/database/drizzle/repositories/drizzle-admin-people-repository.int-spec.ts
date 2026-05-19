import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { AdminPeopleRepository } from '@/domain/delivery/application/repositories/admin-people-repository';
import { DrizzleService } from '../drizzle.service';
import { users } from '../schema';
import { DrizzleAdminPeopleRepository } from './drizzle-admin-people-repository';

let app: INestApplication;
let repository: DrizzleAdminPeopleRepository;
let drizzleService: DrizzleService;

describe('DrizzleAdminPeopleRepository', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    repository = moduleRef.get(AdminPeopleRepository);
    drizzleService = moduleRef.get(DrizzleService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('register', () => {
    it('should register an admin person and return the domain entity', async () => {
      const adminPerson = makeAdminPerson({ emailVerification: null });

      const result = await repository.register(adminPerson);

      expect(result.id.toString()).toEqual(adminPerson.id.toString());
      expect(result.name).toEqual(adminPerson.name);
      expect(result.email).toEqual(adminPerson.email);
      expect(result.cpf.value).toEqual(adminPerson.cpf.value);
    });

    it('should persist the admin person in the database', async () => {
      const adminPerson = makeAdminPerson({ emailVerification: null });

      await repository.register(adminPerson);

      const [persisted] = await drizzleService.db
        .select()
        .from(users)
        .where(eq(users.id, adminPerson.id.toString()));

      expect(persisted).toBeDefined();
      expect(persisted.email).toEqual(adminPerson.email);
      expect(persisted.role).toEqual('ADMIN');
      expect(persisted.version).toEqual(1);
    });
  });

  describe('findByCpf', () => {
    it('should return null when cpf does not exist', async () => {
      const result = await repository.findByCpf('00000000000');

      expect(result).toBeNull();
    });

    it('should return admin person by cpf', async () => {
      const adminPerson = makeAdminPerson({ emailVerification: null });
      await repository.register(adminPerson);

      const result = await repository.findByCpf(adminPerson.cpf.value);

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(adminPerson.id.toString());
      expect(result?.email).toEqual(adminPerson.email);
    });
  });

  describe('findByEmail', () => {
    it('should return null when email does not exist', async () => {
      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should return admin person by email', async () => {
      const adminPerson = makeAdminPerson({ emailVerification: null });
      await repository.register(adminPerson);

      const result = await repository.findByEmail(adminPerson.email);

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(adminPerson.id.toString());
      expect(result?.cpf.value).toEqual(adminPerson.cpf.value);
    });
  });

  describe('findById', () => {
    it('should return null when id does not exist', async () => {
      const result = await repository.findById(randomUUID());

      expect(result).toBeNull();
    });

    it('should return admin person by id', async () => {
      const adminPerson = makeAdminPerson({ emailVerification: null });
      await repository.register(adminPerson);

      const result = await repository.findById(adminPerson.id.toString());

      expect(result).not.toBeNull();
      expect(result?.email).toEqual(adminPerson.email);
      expect(result?.cpf.value).toEqual(adminPerson.cpf.value);
    });
  });

  describe('update', () => {
    it('should return null when admin person does not exist', async () => {
      const adminPerson = makeAdminPerson({ emailVerification: null });

      const result = await repository.update(adminPerson);

      expect(result).toBeNull();
    });

    it('should update admin person name', async () => {
      const adminPerson = makeAdminPerson({ emailVerification: null });
      await repository.register(adminPerson);

      adminPerson.updateName('Updated Name');
      const result = await repository.update(adminPerson);

      expect(result).not.toBeNull();
      expect(result?.name).toEqual('Updated Name');
    });

    it('should increment version on each update', async () => {
      const adminPerson = makeAdminPerson({ emailVerification: null });
      await repository.register(adminPerson);

      await repository.update(adminPerson);

      const [persisted] = await drizzleService.db
        .select()
        .from(users)
        .where(eq(users.id, adminPerson.id.toString()));

      expect(persisted.version).toBe(2);
    });
  });
});
