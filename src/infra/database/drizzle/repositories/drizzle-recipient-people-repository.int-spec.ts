import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { makeModuleRef } from 'test/factories/make-module-ref';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { RecipientPeopleRepository } from '@/domain/delivery/application/repositories/recipient-people-repository';
import { DrizzleService } from '../drizzle.service';
import { recipientProfiles, users } from '../schema';
import { DrizzleRecipientPeopleRepository } from './drizzle-recipient-people-repository';

let app: INestApplication;
let repository: DrizzleRecipientPeopleRepository;
let drizzleService: DrizzleService;

describe('DrizzleRecipientPeopleRepository', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = moduleRef.createNestApplication();
    repository = moduleRef.get(RecipientPeopleRepository);
    drizzleService = moduleRef.get(DrizzleService);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('register', () => {
    it('should register a recipient person and return the domain entity', async () => {
      const recipientPerson = makeRecipientPerson({ emailVerification: null });

      const result = await repository.register(recipientPerson);

      expect(result.id.toString()).toEqual(recipientPerson.id.toString());
      expect(result.name).toEqual(recipientPerson.name);
      expect(result.email).toEqual(recipientPerson.email);
      expect(result.cpf.value).toEqual(recipientPerson.cpf.value);
    });

    it('should persist the user and recipient profile in the database', async () => {
      const recipientPerson = makeRecipientPerson({ emailVerification: null });

      await repository.register(recipientPerson);

      const [persistedUser] = await drizzleService.db
        .select()
        .from(users)
        .where(eq(users.id, recipientPerson.id.toString()));

      const [persistedProfile] = await drizzleService.db
        .select()
        .from(recipientProfiles)
        .where(eq(recipientProfiles.userId, recipientPerson.id.toString()));

      expect(persistedUser).toBeDefined();
      expect(persistedUser.role).toEqual('RECIPIENT');
      expect(persistedUser.version).toEqual(1);
      expect(persistedProfile).toBeDefined();
      expect(persistedProfile.version).toEqual(1);
    });
  });

  describe('findByCpf', () => {
    it('should return null when cpf does not exist', async () => {
      const result = await repository.findByCpf('00000000000');

      expect(result).toBeNull();
    });

    it('should return recipient person by cpf', async () => {
      const recipientPerson = makeRecipientPerson({ emailVerification: null });
      await repository.register(recipientPerson);

      const result = await repository.findByCpf(recipientPerson.cpf.value);

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(recipientPerson.id.toString());
      expect(result?.email).toEqual(recipientPerson.email);
    });
  });

  describe('findByEmail', () => {
    it('should return null when email does not exist', async () => {
      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('should return recipient person by email', async () => {
      const recipientPerson = makeRecipientPerson({ emailVerification: null });
      await repository.register(recipientPerson);

      const result = await repository.findByEmail(recipientPerson.email);

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(recipientPerson.id.toString());
      expect(result?.cpf.value).toEqual(recipientPerson.cpf.value);
    });
  });

  describe('findById', () => {
    it('should return null when id does not exist', async () => {
      const result = await repository.findById(randomUUID());

      expect(result).toBeNull();
    });

    it('should return recipient person by id', async () => {
      const recipientPerson = makeRecipientPerson({ emailVerification: null });
      await repository.register(recipientPerson);

      const result = await repository.findById(recipientPerson.id.toString());

      expect(result).not.toBeNull();
      expect(result?.email).toEqual(recipientPerson.email);
      expect(result?.cpf.value).toEqual(recipientPerson.cpf.value);
    });
  });

  describe('update', () => {
    it('should return null when recipient person does not exist', async () => {
      const recipientPerson = makeRecipientPerson({ emailVerification: null });

      const result = await repository.update(recipientPerson);

      expect(result).toBeNull();
    });

    it('should update recipient person name', async () => {
      const recipientPerson = makeRecipientPerson({ emailVerification: null });
      await repository.register(recipientPerson);

      recipientPerson.updateName('Updated Name');
      const result = await repository.update(recipientPerson);

      expect(result).not.toBeNull();
      expect(result?.name).toEqual('Updated Name');
    });

    it('should increment version on each update', async () => {
      const recipientPerson = makeRecipientPerson({ emailVerification: null });
      await repository.register(recipientPerson);

      await repository.update(recipientPerson);

      const [persistedUser] = await drizzleService.db
        .select()
        .from(users)
        .where(eq(users.id, recipientPerson.id.toString()));

      const [persistedProfile] = await drizzleService.db
        .select()
        .from(recipientProfiles)
        .where(eq(recipientProfiles.userId, recipientPerson.id.toString()));

      expect(persistedUser.version).toBe(2);
      expect(persistedProfile.version).toBe(2);
    });
  });
});
