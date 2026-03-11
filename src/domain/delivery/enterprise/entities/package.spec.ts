import { makePackage } from 'test/factories/make-package';
import { makePackageAttachment } from 'test/factories/make-package-attachment';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { MissingAttachmentError } from '../../errors/missing-attachment-error';
import { PackageAlreadyAssignedError } from '../../application/use-cases/errors/package-already-assined-erro';
import { PackageNotAssignedToDeliveryPersonError } from '../../application/use-cases/errors/package-not-assigned-to-delivery-person-error';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import { PackageStatus } from './value-object/package-status';

describe('Package', () => {
  it('should be able to create a package', () => {
    const recipientId = new UniqueEntityId();

    const packageEntity = makePackage({
      recipientId: recipientId,
      recipientAddress: '123 Main St',
    });

    expect(packageEntity.recipientId).toBe(recipientId);
    expect(packageEntity.recipientAddress).toBe('123 Main St');
    expect(packageEntity.status.isPending()).toBe(true);
  });

  it('should be able to add attachment to package', () => {
    const packageEntity = makePackage({ attachment: null });

    const attachment = makePackageAttachment({
      PackageId: packageEntity.id,
    });

    packageEntity.addAttachment(attachment);

    expect(packageEntity.attachment).toBe(attachment);
    expect(packageEntity.updatedAt).toBeInstanceOf(Date);
  });

  describe('assignDeliveryPerson', () => {
    it('should assign a delivery person and transition status to awaiting_pickup', () => {
      const deliveryPersonId = new UniqueEntityId();
      const authorId = new UniqueEntityId();
      const packageEntity = makePackage();

      const result = packageEntity.assignDeliveryPerson(
        deliveryPersonId,
        authorId
      );

      expect(result.isRight()).toBe(true);
      expect(packageEntity.deliveryPersonId).toBe(deliveryPersonId);
      expect(packageEntity.status.isAwaitingPickup()).toBe(true);
      expect(packageEntity.updatedAt).toBeInstanceOf(Date);
    });

    it('should store custom description in history when provided', () => {
      const deliveryPersonId = new UniqueEntityId();
      const authorId = new UniqueEntityId();
      const packageEntity = makePackage();
      const customDescription = 'Assigned via admin panel';

      packageEntity.assignDeliveryPerson(
        deliveryPersonId,
        authorId,
        customDescription
      );

      const histories = packageEntity.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe(customDescription);
    });

    it('should store default description in history when not provided', () => {
      const deliveryPersonId = new UniqueEntityId();
      const authorId = new UniqueEntityId();
      const packageEntity = makePackage();

      packageEntity.assignDeliveryPerson(deliveryPersonId, authorId);

      const histories = packageEntity.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe(
        'Package assigned to a delivery person'
      );
    });

    it('should fail when transitioning from an invalid status', () => {
      const awaitingPickupResult = PackageStatus.create('awaiting_pickup');

      expect(awaitingPickupResult.isRight()).toBe(true);

      if (awaitingPickupResult.isRight()) {
        const packageEntity = makePackage({
          status: awaitingPickupResult.value,
        });

        const result = packageEntity.assignDeliveryPerson(
          new UniqueEntityId(),
          new UniqueEntityId()
        );

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
        }
      }
    });
  });

  describe('markAsPickedUp', () => {
    it('should mark package as picked up successfully', () => {
      const awaitingPickupResult = PackageStatus.create('awaiting_pickup');

      expect(awaitingPickupResult.isRight()).toBe(true);

      if (awaitingPickupResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: awaitingPickupResult.value,
          deliveryPersonId,
        });

        const result = packageEntity.markAsPickedUp(deliveryPersonId);

        expect(result.isRight()).toBe(true);
        expect(packageEntity.status.isPickedUp()).toBe(true);
        expect(packageEntity.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should store custom description in history when provided', () => {
      const awaitingPickupResult = PackageStatus.create('awaiting_pickup');

      expect(awaitingPickupResult.isRight()).toBe(true);

      if (awaitingPickupResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: awaitingPickupResult.value,
          deliveryPersonId,
        });

        const customDescription = 'Picked up at the front door';

        packageEntity.markAsPickedUp(deliveryPersonId, customDescription);

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe(customDescription);
      }
    });

    it('should store default description in history when not provided', () => {
      const awaitingPickupResult = PackageStatus.create('awaiting_pickup');

      expect(awaitingPickupResult.isRight()).toBe(true);

      if (awaitingPickupResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: awaitingPickupResult.value,
          deliveryPersonId,
        });

        packageEntity.markAsPickedUp(deliveryPersonId);

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe('Package picked up');
      }
    });

    it('should add a history entry on pick up', () => {
      const awaitingPickupResult = PackageStatus.create('awaiting_pickup');

      expect(awaitingPickupResult.isRight()).toBe(true);

      if (awaitingPickupResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: awaitingPickupResult.value,
          deliveryPersonId,
        });

        const initialCount = packageEntity.histories.getItems().length;
        packageEntity.markAsPickedUp(deliveryPersonId);

        expect(packageEntity.histories.getItems().length).toBe(
          initialCount + 1
        );
      }
    });

    it('should fail when package has no delivery person assigned', () => {
      const awaitingPickupResult = PackageStatus.create('awaiting_pickup');

      expect(awaitingPickupResult.isRight()).toBe(true);

      if (awaitingPickupResult.isRight()) {
        const packageEntity = makePackage({
          status: awaitingPickupResult.value,
          deliveryPersonId: null,
        });

        const result = packageEntity.markAsPickedUp(new UniqueEntityId());

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(
            PackageNotAssignedToDeliveryPersonError
          );
        }
      }
    });

    it('should fail when package is assigned to a different delivery person', () => {
      const awaitingPickupResult = PackageStatus.create('awaiting_pickup');

      expect(awaitingPickupResult.isRight()).toBe(true);

      if (awaitingPickupResult.isRight()) {
        const assignedDeliveryPersonId = new UniqueEntityId();
        const anotherDeliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: awaitingPickupResult.value,
          deliveryPersonId: assignedDeliveryPersonId,
        });

        const result = packageEntity.markAsPickedUp(anotherDeliveryPersonId);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(PackageAlreadyAssignedError);
        }
      }
    });

    it('should fail when package is not in awaiting_pickup status', () => {
      const deliveryPersonId = new UniqueEntityId();
      const packageEntity = makePackage({ deliveryPersonId });

      const result = packageEntity.markAsPickedUp(deliveryPersonId);

      expect(result.isLeft()).toBe(true);
    });
  });

  describe('markAsCanceled', () => {
    it('should mark package as canceled successfully', () => {
      const authorId = new UniqueEntityId();
      const packageEntity = makePackage();

      const result = packageEntity.markAsCanceled(authorId);

      expect(result.isRight()).toBe(true);
      expect(packageEntity.status.isCanceled()).toBe(true);
      expect(packageEntity.updatedAt).toBeInstanceOf(Date);
    });

    it('should store custom description in history when provided', () => {
      const authorId = new UniqueEntityId();
      const packageEntity = makePackage();
      const customDescription = 'Canceled by recipient request';

      packageEntity.markAsCanceled(authorId, customDescription);

      const histories = packageEntity.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe(customDescription);
    });

    it('should store default description in history when not provided', () => {
      const authorId = new UniqueEntityId();
      const packageEntity = makePackage();

      packageEntity.markAsCanceled(authorId);

      const histories = packageEntity.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe('Package canceled');
    });

    it('should add a history entry on cancelation', () => {
      const authorId = new UniqueEntityId();
      const packageEntity = makePackage();

      const initialCount = packageEntity.histories.getItems().length;
      packageEntity.markAsCanceled(authorId);

      expect(packageEntity.histories.getItems().length).toBe(initialCount + 1);
    });

    it('should fail when transitioning from an invalid status', () => {
      const canceledResult = PackageStatus.create('canceled');

      expect(canceledResult.isRight()).toBe(true);

      if (canceledResult.isRight()) {
        const packageEntity = makePackage({ status: canceledResult.value });

        const result = packageEntity.markAsCanceled(new UniqueEntityId());

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
        }
      }
    });
  });

  describe('addAttachment', () => {
    it('should not be able to mark as delivered without attachment', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          attachment: null,
        });

        expect(packageEntity.attachment).toBeNull();
      }
    });

    it('should be able to add attachment to package without one', () => {
      const packageId = new UniqueEntityId();
      const packageEntity = makePackage({ id: packageId, attachment: null });

      expect(packageEntity.attachment).toBeNull();

      const attachment = makePackageAttachment({ PackageId: packageId });
      packageEntity.addAttachment(attachment);

      expect(packageEntity.attachment).toBe(attachment);
      expect(packageEntity.updatedAt).toBeInstanceOf(Date);
    });
  });
});
