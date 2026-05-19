import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { makePackage } from 'test/factories/make-package';
import { makePackageHistory } from 'test/factories/make-package-history';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { AdminPeopleRepository } from '@/domain/delivery/application/repositories/admin-people-repository';
import { PackagesHistoryRepository } from '@/domain/delivery/application/repositories/packages-history-repository';
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository';
import { RecipientPeopleRepository } from '@/domain/delivery/application/repositories/recipient-people-repository';
import { PackageHistoryList } from '@/domain/delivery/enterprise/entities/value-object/package-history-list';
import { DrizzlePackagesHistoryRepository } from './drizzle-packages-history-repository';

let app: INestApplication;
let repository: DrizzlePackagesHistoryRepository;
let packagesRepository: PackagesRepository;
let adminRepository: AdminPeopleRepository;
let recipientRepository: RecipientPeopleRepository;

describe('DrizzlePackagesHistoryRepository', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    repository = moduleRef.get(PackagesHistoryRepository);
    packagesRepository = moduleRef.get(PackagesRepository);
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

    return { pkg, author };
  }

  describe('register', () => {
    it('should register a package history and return the domain entity', async () => {
      const { pkg, author } = await seedPackage();

      const history = makePackageHistory({
        packageId: pkg.id,
        authorId: author.id,
      });

      const result = await repository.register(history);

      expect(result.id.toString()).toEqual(history.id.toString());
      expect(result.packageId.toString()).toEqual(pkg.id.toString());
    });
  });

  describe('findById', () => {
    it('should return null when id does not exist', async () => {
      const result = await repository.findById(randomUUID());

      expect(result).toBeNull();
    });

    it('should return package history by id', async () => {
      const { pkg, author } = await seedPackage();

      const history = makePackageHistory({
        packageId: pkg.id,
        authorId: author.id,
      });
      await repository.register(history);

      const result = await repository.findById(history.id.toString());

      expect(result).not.toBeNull();
      expect(result?.packageId.toString()).toEqual(pkg.id.toString());
    });
  });

  describe('findManyByPackageId', () => {
    it('should return null when package has no histories', async () => {
      const result = await repository.findManyByPackageId(randomUUID());

      expect(result).toBeNull();
    });

    it('should return histories for a package', async () => {
      const { pkg, author } = await seedPackage();

      const h1 = makePackageHistory({ packageId: pkg.id, authorId: author.id });
      const h2 = makePackageHistory({ packageId: pkg.id, authorId: author.id });
      await repository.register(h1);
      await repository.register(h2);

      const result = await repository.findManyByPackageId(pkg.id.toString());

      expect(result).not.toBeNull();
      expect(result?.length).toBeGreaterThanOrEqual(2);
    });
  });
});
