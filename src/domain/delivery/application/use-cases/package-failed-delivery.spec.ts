import { makeAttachment } from 'test/factories/make-attachment';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackageAttachmentsRepository } from 'test/repositories/in-memory-package-attachments-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';

import { Package } from '../../enterprise/entities/package';
import { PackageStatus } from '../../enterprise/entities/value-object/package-status';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import { DeliveryPersonNotAssignedToPackageError } from './errors/delivery-person-not-assigned-to-package-error';
import { DeliveryWithoutRequiredPhoto } from './errors/delivery-without-required-photo';
import { PackageNotAssignedToDeliveryPersonError } from './errors/package-not-assigned-to-delivery-person-error';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { PackageFailedDeliveryUseCase } from './package-failed-delivery';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let attachmentsRepository: InMemoryAttachmentsRepository;
let packageAttachmentsRepository: InMemoryPackageAttachmentsRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: PackageFailedDeliveryUseCase;

describe('Package Failed Delivery', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    attachmentsRepository = new InMemoryAttachmentsRepository();
    packageAttachmentsRepository = new InMemoryPackageAttachmentsRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new PackageFailedDeliveryUseCase(
      packagesRepository,
      attachmentsRepository,
      packageAttachmentsRepository,
      deliveryPeopleRepository
    );
  });

  it('should be able to mark a package as failed delivery', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.status.isFailedDelivery()).toBe(true);
    }
  });

  it('should transition package status to failed_delivery', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.status).toBeInstanceOf(PackageStatus);
      expect(result.value.package.status.value).toBe('failed_delivery');
    }
  });

  it('should persist the package attachment in the repository', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(packageAttachmentsRepository.packageAttachments).toHaveLength(1);
    expect(
      packageAttachmentsRepository.packageAttachments[0].attachmentId
    ).toEqual(attachment.id);
  });

  it('should persist the updated package in the repository', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    const updatedPackage = await packagesRepository.findById(
      packageEntity.id.toString()
    );

    expect(updatedPackage?.status.isFailedDelivery()).toBe(true);
  });

  it('should create a package history entry on failed delivery', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const initialHistoryCount = packageEntity.histories.getItems().length;

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.histories.getItems().length).toBe(
        initialHistoryCount + 1
      );
    }
  });

  it('should store custom description in history when provided', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const customDescription = 'Recipient not home';

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
      description: customDescription,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const histories = result.value.package.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe(customDescription);
    }
  });

  it('should store default description in history when not provided', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const histories = result.value.package.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe('Package delivery failed');
    }
  });

  it('should not be able to mark as failed delivery without an attachment', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: 'non-existent-attachment-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DeliveryWithoutRequiredPhoto);
    }
  });

  it('should not be able to mark as failed delivery with a non-existent delivery person', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const attachment = makeAttachment();
    const packageEntity = makePackage({ status: outForDeliveryStatus.value });

    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: 'non-existent-delivery-person-id',
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to mark as failed delivery a non-existent package', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: 'non-existent-package-id',
      attachmentId: attachment.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to mark as failed delivery a package not assigned to any delivery person', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: null,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        PackageNotAssignedToDeliveryPersonError
      );
    }
  });

  it('should not be able to mark as failed delivery a package assigned to a different delivery person', async () => {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const anotherDeliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryStatus.value,
      deliveryPersonId: anotherDeliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(
        DeliveryPersonNotAssignedToPackageError
      );
    }
  });

  it('should not be able to mark as failed delivery a package in invalid status', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      deliveryPersonId: deliveryPerson.id.toString(),
      packageId: packageEntity.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
    }
  });
});
