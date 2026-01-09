import { makePackage } from 'test/factories/make-package';
import { makePackageAttachment } from 'test/factories/make-package-attachment';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { MissingAttachmentError } from '../../errors/missing-attachment-error';
import { PackageStatus } from './value-object/package-status';

describe('Package', () => {
  it('should be able to create a package', () => {
    const packageEntity = makePackage({
      recipientName: 'John Doe',
      recipientAddress: '123 Main St',
    });

    expect(packageEntity.recipientName).toBe('John Doe');
    expect(packageEntity.recipientAddress).toBe('123 Main St');
    expect(packageEntity.status.isPending()).toBe(true);
  });

  it('should be able to update package status', () => {
    const packageEntity = makePackage({
      status: PackageStatus.create('pending'),
    });

    const newStatus = PackageStatus.create('awaiting_pickup');
    const result = packageEntity.updateStatus(newStatus);

    expect(result.isRight()).toBe(true);
    expect(packageEntity.status.isAwaitingPickup()).toBe(true);
    expect(packageEntity.updatedAt).toBeInstanceOf(Date);
  });

  it('should not be able to mark as delivered without attachment', () => {
    const packageEntity = makePackage({
      status: PackageStatus.create('out_for_delivery'),
      attachment: null,
    });

    const deliveredStatus = PackageStatus.create('delivered');
    const result = packageEntity.updateStatus(deliveredStatus);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(MissingAttachmentError);
    }
  });

  it('should be able to mark as delivered with attachment', () => {
    const packageId = new UniqueEntityId();
    const attachment = makePackageAttachment({
      PackageId: packageId,
    });

    const packageEntity = makePackage({
      id: packageId,
      status: PackageStatus.create('out_for_delivery'),
      attachment,
    });

    const deliveredStatus = PackageStatus.create('delivered');
    const result = packageEntity.updateStatus(deliveredStatus);

    expect(result.isRight()).toBe(true);
    expect(packageEntity.status.isDelivered()).toBe(true);
    expect(packageEntity.deliveredAt).toBeInstanceOf(Date);
  });

  it('should be able to add attachment to package', () => {
    const packageEntity = makePackage({
      status: PackageStatus.create('pending'),
      attachment: null,
    });

    const attachment = makePackageAttachment({
      PackageId: packageEntity.id,
    });

    packageEntity.addAttachment(attachment);

    expect(packageEntity.attachment).toBe(attachment);
    expect(packageEntity.updatedAt).toBeInstanceOf(Date);
  });

  it('should be able to assign delivery person to package', () => {
    const deliveryPersonId = new UniqueEntityId();
    const packageEntity = makePackage({
      status: PackageStatus.create('pending'),
    });

    packageEntity.assignDeliveryPerson(deliveryPersonId);

    expect(packageEntity.deliveryPersonId).toBe(deliveryPersonId);
    expect(packageEntity.updatedAt).toBeInstanceOf(Date);
  });

  it('should set deliveredAt when package is marked as delivered', () => {
    const packageId = new UniqueEntityId();
    const attachment = makePackageAttachment({
      PackageId: packageId,
    });

    const packageEntity = makePackage({
      id: packageId,
      status: PackageStatus.create('out_for_delivery'),
      attachment,
    });

    expect(packageEntity.deliveredAt).toBeNull();

    const deliveredStatus = PackageStatus.create('delivered');
    packageEntity.updateStatus(deliveredStatus);

    expect(packageEntity.deliveredAt).toBeInstanceOf(Date);
  });

  it('should be able to update status to non-delivered states without attachment', () => {
    const packageEntity = makePackage({
      status: PackageStatus.create('pending'),
      attachment: null,
    });

    const statuses = [
      'awaiting_pickup',
      'picked_up',
      'at_distribution_center',
      'in_transit',
      'out_for_delivery',
    ];

    for (const statusValue of statuses) {
      const newStatus = PackageStatus.create(statusValue);
      const result = packageEntity.updateStatus(newStatus);

      expect(result.isRight()).toBe(true);
      expect(packageEntity.status.value).toBe(statusValue);
    }
  });

  it('should follow correct flow: add attachment first, then mark as delivered', () => {
    const packageId = new UniqueEntityId();
    const packageEntity = makePackage({
      id: packageId,
      status: PackageStatus.create('out_for_delivery'),
      attachment: null,
    });

    const deliveredStatus = PackageStatus.create('delivered');
    const failedResult = packageEntity.updateStatus(deliveredStatus);

    expect(failedResult.isLeft()).toBe(true);
    if (failedResult.isLeft()) {
      expect(failedResult.value).toBeInstanceOf(MissingAttachmentError);
    }

    const attachment = makePackageAttachment({
      PackageId: packageId,
    });
    packageEntity.addAttachment(attachment);

    expect(packageEntity.attachment).toBe(attachment);

    const successResult = packageEntity.updateStatus(deliveredStatus);

    expect(successResult.isRight()).toBe(true);
    expect(packageEntity.status.isDelivered()).toBe(true);
    expect(packageEntity.deliveredAt).toBeInstanceOf(Date);
  });
});
