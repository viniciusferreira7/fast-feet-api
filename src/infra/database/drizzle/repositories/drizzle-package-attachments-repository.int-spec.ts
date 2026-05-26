import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeAttachment } from 'test/factories/make-attachment';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { makePackage } from 'test/factories/make-package';
import { makePackageAttachment } from 'test/factories/make-package-attachment';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { AdminPeopleRepository } from '@/domain/delivery/application/repositories/admin-people-repository';
import { AttachmentsRepository } from '@/domain/delivery/application/repositories/attachments-repository';
import { PackageAttachmentsRepository } from '@/domain/delivery/application/repositories/package-attachments-repository';
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { RecipientPeopleRepository } from '@/domain/delivery/application/repositories/recipient-people-repository';
import { PackageHistoryList } from '@/domain/delivery/enterprise/entities/value-object/package-history-list';
import { DrizzlePackageAttachmentsRepository } from './drizzle-package-attachments-repository';

let app: INestApplication;
let repository: DrizzlePackageAttachmentsRepository;
let packagesRepository: PackagesRepository;
let attachmentsRepository: AttachmentsRepository;
let adminRepository: AdminPeopleRepository;
let recipientRepository: RecipientPeopleRepository;

describe('DrizzlePackageAttachmentsRepository', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    repository = moduleRef.get(PackageAttachmentsRepository);
    packagesRepository = moduleRef.get(PackagesRepository);
    attachmentsRepository = moduleRef.get(AttachmentsRepository);
    adminRepository = moduleRef.get(AdminPeopleRepository);
    recipientRepository = moduleRef.get(RecipientPeopleRepository);
  });

  afterEach(async () => {
    await app.close();
  });

  async function seedPackage() {
    const author = makeAdminPerson({ emailVerification: null });
    const recipient = makeRecipientPerson({ emailVerification: null });
    await adminRepository.register(author);
    await recipientRepository.register(recipient);

    const pkg = makePackage({
      authorId: author.id,
      recipientId: recipient.id,
      deliveryPersonId: null,
      histories: new PackageHistoryList([]),
    });
    await packagesRepository.register(pkg);

    return pkg;
  }

  async function seedAttachment() {
    const attachment = makeAttachment();
    await attachmentsRepository.create(attachment);
    return attachment;
  }

  describe('create', () => {
    it('should link an attachment to a package by setting attachmentId', async () => {
      const pkg = await seedPackage();
      const attachment = await seedAttachment();

      const packageAttachment = makePackageAttachment({
        PackageId: pkg.id,
        attachmentId: attachment.id,
      });

      await expect(repository.create(packageAttachment)).resolves.not.toThrow();
    });

    it('should return the same PackageAttachment passed in', async () => {
      const pkg = await seedPackage();
      const attachment = await seedAttachment();

      const packageAttachment = makePackageAttachment({
        PackageId: pkg.id,
        attachmentId: attachment.id,
      });

      const result = await repository.create(packageAttachment);

      expect(result.PackageId.toString()).toEqual(pkg.id.toString());
      expect(result.attachmentId.toString()).toEqual(attachment.id.toString());
    });

    it('should make the attachment findable by package id after creation', async () => {
      const pkg = await seedPackage();
      const attachment = await seedAttachment();

      const packageAttachment = makePackageAttachment({
        PackageId: pkg.id,
        attachmentId: attachment.id,
      });
      await repository.create(packageAttachment);

      const found = await repository.findById(pkg.id.toString());

      expect(found).not.toBeNull();
      expect(found?.PackageId.toString()).toEqual(pkg.id.toString());
      expect(found?.attachmentId.toString()).toEqual(attachment.id.toString());
    });
  });

  describe('findById', () => {
    it('should return null when the package does not exist', async () => {
      const result = await repository.findById(randomUUID());

      expect(result).toBeNull();
    });

    it('should return null when the package exists but has no attachment', async () => {
      const pkg = await seedPackage();

      const result = await repository.findById(pkg.id.toString());

      expect(result).toBeNull();
    });

    it('should return PackageAttachment when the package has an attachment', async () => {
      const pkg = await seedPackage();
      const attachment = await seedAttachment();

      await repository.create(
        makePackageAttachment({
          PackageId: pkg.id,
          attachmentId: attachment.id,
        })
      );

      const result = await repository.findById(pkg.id.toString());

      expect(result).not.toBeNull();
      expect(result?.PackageId.toString()).toEqual(pkg.id.toString());
      expect(result?.attachmentId.toString()).toEqual(attachment.id.toString());
    });
  });

  describe('delete', () => {
    it('should return null when the package does not exist', async () => {
      const result = await repository.delete(randomUUID());

      expect(result).toBeNull();
    });

    it('should return null when the package exists but has no attachment', async () => {
      const pkg = await seedPackage();

      const result = await repository.delete(pkg.id.toString());

      expect(result).toBeNull();
    });

    it('should return the removed PackageAttachment', async () => {
      const pkg = await seedPackage();
      const attachment = await seedAttachment();

      await repository.create(
        makePackageAttachment({
          PackageId: pkg.id,
          attachmentId: attachment.id,
        })
      );

      const result = await repository.delete(pkg.id.toString());

      expect(result).not.toBeNull();
      expect(result?.PackageId.toString()).toEqual(pkg.id.toString());
      expect(result?.attachmentId.toString()).toEqual(attachment.id.toString());
    });

    it('should clear the attachment so findById returns null afterwards', async () => {
      const pkg = await seedPackage();
      const attachment = await seedAttachment();

      await repository.create(
        makePackageAttachment({
          PackageId: pkg.id,
          attachmentId: attachment.id,
        })
      );

      await repository.delete(pkg.id.toString());

      const found = await repository.findById(pkg.id.toString());

      expect(found).toBeNull();
    });

    it('should be idempotent — second delete returns null', async () => {
      const pkg = await seedPackage();
      const attachment = await seedAttachment();

      await repository.create(
        makePackageAttachment({
          PackageId: pkg.id,
          attachmentId: attachment.id,
        })
      );

      await repository.delete(pkg.id.toString());
      const secondDelete = await repository.delete(pkg.id.toString());

      expect(secondDelete).toBeNull();
    });
  });
});
