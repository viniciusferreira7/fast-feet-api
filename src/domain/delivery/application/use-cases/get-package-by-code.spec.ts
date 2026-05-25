import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { PackageDetails } from '../../enterprise/entities/value-object/package-details';
import { GetByPackageByCodeUseCase } from './get-package-by-code';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let attachmentsRepository: InMemoryAttachmentsRepository;
let sut: GetByPackageByCodeUseCase;

describe('Get Package By Code', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    attachmentsRepository = new InMemoryAttachmentsRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository,
      {
        adminPeople: adminPeopleRepository,
        recipientPeople: recipientPeopleRepository,
        deliveryPeople: deliveryPeopleRepository,
        attachments: attachmentsRepository,
      }
    );
    sut = new GetByPackageByCodeUseCase(packagesRepository);
  });

  it('should be able to get package details by code', async () => {
    const author = makeAdminPerson();
    const recipient = makeRecipientPerson();
    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({
      authorId: author.id,
      recipientId: recipient.id,
      deliveryPersonId: deliveryPerson.id,
    });

    await adminPeopleRepository.register(author);
    await recipientPeopleRepository.register(recipient);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageCode: packageEntity.code.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(PackageDetails);
      expect(result.value.package.packageId.equals(packageEntity.id)).toBe(
        true
      );
      expect(result.value.package.recipient.name).toBe(recipient.name);
      expect(result.value.package.author.name).toBe(author.name);
      expect(result.value.package.deliveryPerson?.name).toBe(
        deliveryPerson.name
      );
    }
  });

  it('should return the correct package data', async () => {
    const author = makeAdminPerson();
    const recipient = makeRecipientPerson();
    const packageEntity = makePackage({
      authorId: author.id,
      recipientId: recipient.id,
      deliveryPersonId: null,
    });

    await adminPeopleRepository.register(author);
    await recipientPeopleRepository.register(recipient);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageCode: packageEntity.code.value,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.name).toBe(packageEntity.name);
      expect(result.value.package.code.equals(packageEntity.code)).toBe(true);
      expect(result.value.package.deliveryPerson).toBeNull();
    }
  });

  it('should not be able to get a package with a non-existent code', async () => {
    const result = await sut.execute({
      packageCode: '01AAAAAAAAAAAAAAAAAAAAAAAAA',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });
});
