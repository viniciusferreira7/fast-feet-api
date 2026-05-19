import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { EmailVerificationsRepository } from '@/domain/delivery/application/repositories/email-verifications-repository';
import { EmailVerification } from '@/domain/delivery/enterprise/entities/email-verification';
import { DrizzleService } from '../drizzle.service';
import { emailsCodes } from '../schema';
import { DrizzleEmailVerificationsRepository } from './drizzle-email-verifications-repository';

let app: INestApplication;
let repository: DrizzleEmailVerificationsRepository;
let drizzleService: DrizzleService;

describe('DrizzleEmailVerificationsRepository', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    repository = moduleRef.get(EmailVerificationsRepository);
    drizzleService = moduleRef.get(DrizzleService);
  });

  afterEach(async () => {
    await app.close();
  });

  function makeEmailVerification() {
    const result = EmailVerification.create({ validatedAt: null });

    if (result.isLeft()) {
      throw new Error('Failed to create email verification in test');
    }

    return result.value;
  }

  describe('create', () => {
    it('should create an email verification and return the domain entity', async () => {
      const emailVerification = makeEmailVerification();

      const result = await repository.create(emailVerification);

      expect(result.id.toString()).toEqual(emailVerification.id.toString());
      expect(result.code).toEqual(emailVerification.code);
    });

    it('should persist the email verification in the database', async () => {
      const emailVerification = makeEmailVerification();

      await repository.create(emailVerification);

      const [persisted] = await drizzleService.db
        .select()
        .from(emailsCodes)
        .where(eq(emailsCodes.id, emailVerification.id.toString()));

      expect(persisted).toBeDefined();
      expect(persisted.code).toEqual(emailVerification.code);
    });
  });

  describe('findByCode', () => {
    it('should return null when code does not exist', async () => {
      const result = await repository.findByCode('000000');

      expect(result).toBeNull();
    });

    it('should return email verification by code', async () => {
      const emailVerification = makeEmailVerification();
      await repository.create(emailVerification);

      const result = await repository.findByCode(emailVerification.code);

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(emailVerification.id.toString());
    });
  });

  describe('deleteByCode', () => {
    it('should return null when code does not exist', async () => {
      const result = await repository.deleteByCode('000000');

      expect(result).toBeNull();
    });

    it('should delete and return the email verification', async () => {
      const emailVerification = makeEmailVerification();
      await repository.create(emailVerification);

      const result = await repository.deleteByCode(emailVerification.code);

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(emailVerification.id.toString());

      const [persisted] = await drizzleService.db
        .select()
        .from(emailsCodes)
        .where(eq(emailsCodes.id, emailVerification.id.toString()));

      expect(persisted).toBeUndefined();
    });
  });
});
