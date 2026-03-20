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
import { DeliveryWithoutRequiredPhoto } from './errors/delivery-without-required-photo';
import { ResourceNotFoundError } from './errors/resource-not-found-error';
import { PackageWasDeliveredUseCase } from './package-was-delivered';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let attachmentsRepository: InMemoryAttachmentsRepository;
let packageAttachmentsRepository: InMemoryPackageAttachmentsRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let sut: PackageWasDeliveredUseCase;

describe('Package Was Delivered', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    attachmentsRepository = new InMemoryAttachmentsRepository();
    packageAttachmentsRepository = new InMemoryPackageAttachmentsRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    sut = new PackageWasDeliveredUseCase(
      packagesRepository,
      attachmentsRepository,
      packageAttachmentsRepository,
      deliveryPeopleRepository
    );
  });

  it('should be able to mark a package as delivered', async () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');

    if (outForDeliveryResult.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryResult.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package).toBeInstanceOf(Package);
      expect(result.value.package.status.isDelivered()).toBe(true);
    }
  });

  it('should set deliveredAt when package is delivered', async () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');

    if (outForDeliveryResult.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryResult.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.package.deliveredAt).toBeInstanceOf(Date);
    }
  });

  it('should persist the package attachment in the repository', async () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');

    if (outForDeliveryResult.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryResult.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(packageAttachmentsRepository.packageAttachments).toHaveLength(1);
    expect(
      packageAttachmentsRepository.packageAttachments[0].attachmentId
    ).toEqual(attachment.id);
  });

  it('should persist the updated package in the repository', async () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');

    if (outForDeliveryResult.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryResult.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    const updatedPackage = await packagesRepository.findById(
      packageEntity.id.toString()
    );

    expect(updatedPackage?.status.isDelivered()).toBe(true);
  });

  it('should be able to deliver with a custom description', async () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');

    if (outForDeliveryResult.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryResult.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const customDescription = 'Delivered to the neighbor';

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
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

  it('should not be able to deliver a non-existent package', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);

    const result = await sut.execute({
      packageId: 'non-existent-package-id',
      deliveryPersonId: deliveryPerson.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to deliver without an attachment', async () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');

    if (outForDeliveryResult.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const deliveryPerson = makeDeliveryPerson();
    const packageEntity = makePackage({
      status: outForDeliveryResult.value,
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      attachmentId: 'non-existent-attachment-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DeliveryWithoutRequiredPhoto);
    }
  });

  it('should not be able to deliver with a non-existent delivery person', async () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');

    if (outForDeliveryResult.isLeft()) {
      throw new Error('Failed to create out_for_delivery status');
    }

    const attachment = makeAttachment();
    const packageEntity = makePackage({
      status: outForDeliveryResult.value,
    });

    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: 'non-existent-delivery-person-id',
      attachmentId: attachment.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to deliver a package that is not out_for_delivery', async () => {
    const deliveryPerson = makeDeliveryPerson();
    const attachment = makeAttachment();
    const packageEntity = makePackage({
      deliveryPersonId: deliveryPerson.id,
    });

    await deliveryPeopleRepository.register(deliveryPerson);
    await attachmentsRepository.create(attachment);
    await packagesRepository.register(packageEntity);

    const result = await sut.execute({
      packageId: packageEntity.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      attachmentId: attachment.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
  });
});
