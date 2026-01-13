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
    const pendingStatusResult = PackageStatus.create('pending');
    const awaitingPickupResult = PackageStatus.create('awaiting_pickup');

    expect(pendingStatusResult.isRight()).toBe(true);
    expect(awaitingPickupResult.isRight()).toBe(true);

    if (pendingStatusResult.isRight() && awaitingPickupResult.isRight()) {
      const packageEntity = makePackage({
        status: pendingStatusResult.value,
      });

      const result = packageEntity.updateStatus(awaitingPickupResult.value);

      expect(result.isRight()).toBe(true);
      expect(packageEntity.status.isAwaitingPickup()).toBe(true);
      expect(packageEntity.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should not be able to mark as delivered without attachment', () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');
    const deliveredResult = PackageStatus.create('delivered');

    expect(outForDeliveryResult.isRight()).toBe(true);
    expect(deliveredResult.isRight()).toBe(true);

    if (outForDeliveryResult.isRight() && deliveredResult.isRight()) {
      const packageEntity = makePackage({
        status: outForDeliveryResult.value,
        attachment: null,
      });

      const result = packageEntity.updateStatus(deliveredResult.value);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(MissingAttachmentError);
      }
    }
  });

  it('should be able to mark as delivered with attachment', () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');
    const deliveredResult = PackageStatus.create('delivered');

    expect(outForDeliveryResult.isRight()).toBe(true);
    expect(deliveredResult.isRight()).toBe(true);

    if (outForDeliveryResult.isRight() && deliveredResult.isRight()) {
      const packageId = new UniqueEntityId();
      const attachment = makePackageAttachment({
        PackageId: packageId,
      });

      const packageEntity = makePackage({
        id: packageId,
        status: outForDeliveryResult.value,
        attachment,
      });

      const result = packageEntity.updateStatus(deliveredResult.value);

      expect(result.isRight()).toBe(true);
      expect(packageEntity.status.isDelivered()).toBe(true);
      expect(packageEntity.deliveredAt).toBeInstanceOf(Date);
    }
  });

  it('should be able to add attachment to package', () => {
    const pendingResult = PackageStatus.create('pending');

    expect(pendingResult.isRight()).toBe(true);

    if (pendingResult.isRight()) {
      const packageEntity = makePackage({
        status: pendingResult.value,
        attachment: null,
      });

      const attachment = makePackageAttachment({
        PackageId: packageEntity.id,
      });

      packageEntity.addAttachment(attachment);

      expect(packageEntity.attachment).toBe(attachment);
      expect(packageEntity.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should be able to assign delivery person to package', () => {
    const pendingResult = PackageStatus.create('pending');

    expect(pendingResult.isRight()).toBe(true);

    if (pendingResult.isRight()) {
      const deliveryPersonId = new UniqueEntityId();
      const packageEntity = makePackage({
        status: pendingResult.value,
      });

      packageEntity.assignDeliveryPerson(deliveryPersonId);

      expect(packageEntity.deliveryPersonId).toBe(deliveryPersonId);
      expect(packageEntity.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should set deliveredAt when package is marked as delivered', () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');
    const deliveredResult = PackageStatus.create('delivered');

    expect(outForDeliveryResult.isRight()).toBe(true);
    expect(deliveredResult.isRight()).toBe(true);

    if (outForDeliveryResult.isRight() && deliveredResult.isRight()) {
      const packageId = new UniqueEntityId();
      const attachment = makePackageAttachment({
        PackageId: packageId,
      });

      const packageEntity = makePackage({
        id: packageId,
        status: outForDeliveryResult.value,
        attachment,
      });

      expect(packageEntity.deliveredAt).toBeNull();

      packageEntity.updateStatus(deliveredResult.value);

      expect(packageEntity.deliveredAt).toBeInstanceOf(Date);
    }
  });

  it('should be able to update status to non-delivered states without attachment', () => {
    const pendingResult = PackageStatus.create('pending');

    expect(pendingResult.isRight()).toBe(true);

    if (pendingResult.isRight()) {
      const packageEntity = makePackage({
        status: pendingResult.value,
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
        const newStatusResult = PackageStatus.create(statusValue);

        expect(newStatusResult.isRight()).toBe(true);

        if (newStatusResult.isRight()) {
          const result = packageEntity.updateStatus(newStatusResult.value);

          expect(result.isRight()).toBe(true);
          expect(packageEntity.status.value).toBe(statusValue);
        }
      }
    }
  });

  it('should follow correct flow: add attachment first, then mark as delivered', () => {
    const outForDeliveryResult = PackageStatus.create('out_for_delivery');
    const deliveredResult = PackageStatus.create('delivered');

    expect(outForDeliveryResult.isRight()).toBe(true);
    expect(deliveredResult.isRight()).toBe(true);

    if (outForDeliveryResult.isRight() && deliveredResult.isRight()) {
      const packageId = new UniqueEntityId();
      const packageEntity = makePackage({
        id: packageId,
        status: outForDeliveryResult.value,
        attachment: null,
      });

      const failedResult = packageEntity.updateStatus(deliveredResult.value);

      expect(failedResult.isLeft()).toBe(true);
      if (failedResult.isLeft()) {
        expect(failedResult.value).toBeInstanceOf(MissingAttachmentError);
      }

      const attachment = makePackageAttachment({
        PackageId: packageId,
      });
      packageEntity.addAttachment(attachment);

      expect(packageEntity.attachment).toBe(attachment);

      const successResult = packageEntity.updateStatus(deliveredResult.value);

      expect(successResult.isRight()).toBe(true);
      expect(packageEntity.status.isDelivered()).toBe(true);
      expect(packageEntity.deliveredAt).toBeInstanceOf(Date);
    }
  });
});
