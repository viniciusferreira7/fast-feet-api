import { makePackage } from 'test/factories/make-package';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';

import { DeliveryPersonNotAssignedToPackageError } from '../../application/use-cases/errors/delivery-person-not-assigned-to-package-error';
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

  describe('markAsInTransit', () => {
    it('should mark package as in transit successfully', () => {
      const atDistributionCenterResult = PackageStatus.create(
        'at_distribution_center'
      );

      expect(atDistributionCenterResult.isRight()).toBe(true);

      if (atDistributionCenterResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const authorId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: atDistributionCenterResult.value,
          deliveryPersonId,
        });

        const result = packageEntity.markAsInTransit(
          authorId,
          deliveryPersonId
        );

        expect(result.isRight()).toBe(true);
        expect(packageEntity.status.isInTransit()).toBe(true);
        expect(packageEntity.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should clear deliveryPersonId after marking as in transit', () => {
      const atDistributionCenterResult = PackageStatus.create(
        'at_distribution_center'
      );

      expect(atDistributionCenterResult.isRight()).toBe(true);

      if (atDistributionCenterResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const authorId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: atDistributionCenterResult.value,
          deliveryPersonId,
        });

        packageEntity.markAsInTransit(authorId, deliveryPersonId);

        expect(packageEntity.deliveryPersonId).toBeNull();
      }
    });

    it('should store custom description in history when provided', () => {
      const atDistributionCenterResult = PackageStatus.create(
        'at_distribution_center'
      );

      expect(atDistributionCenterResult.isRight()).toBe(true);

      if (atDistributionCenterResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const authorId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: atDistributionCenterResult.value,
          deliveryPersonId,
        });

        const customDescription = 'Dispatched from central hub';
        packageEntity.markAsInTransit(
          authorId,
          deliveryPersonId,
          customDescription
        );

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe(customDescription);
      }
    });

    it('should store default description in history when not provided', () => {
      const atDistributionCenterResult = PackageStatus.create(
        'at_distribution_center'
      );

      expect(atDistributionCenterResult.isRight()).toBe(true);

      if (atDistributionCenterResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const authorId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: atDistributionCenterResult.value,
          deliveryPersonId,
        });

        packageEntity.markAsInTransit(authorId, deliveryPersonId);

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe('Package is in transit');
      }
    });

    it('should add a history entry on marking as in transit', () => {
      const atDistributionCenterResult = PackageStatus.create(
        'at_distribution_center'
      );

      expect(atDistributionCenterResult.isRight()).toBe(true);

      if (atDistributionCenterResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const authorId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: atDistributionCenterResult.value,
          deliveryPersonId,
        });

        const initialCount = packageEntity.histories.getItems().length;
        packageEntity.markAsInTransit(authorId, deliveryPersonId);

        expect(packageEntity.histories.getItems().length).toBe(
          initialCount + 1
        );
      }
    });

    it('should fail when package has no delivery person assigned', () => {
      const atDistributionCenterResult = PackageStatus.create(
        'at_distribution_center'
      );

      expect(atDistributionCenterResult.isRight()).toBe(true);

      if (atDistributionCenterResult.isRight()) {
        const packageEntity = makePackage({
          status: atDistributionCenterResult.value,
          deliveryPersonId: null,
        });

        const result = packageEntity.markAsInTransit(
          new UniqueEntityId(),
          new UniqueEntityId()
        );

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(
            PackageNotAssignedToDeliveryPersonError
          );
        }
      }
    });

    it('should fail when package is assigned to a different delivery person', () => {
      const atDistributionCenterResult = PackageStatus.create(
        'at_distribution_center'
      );

      expect(atDistributionCenterResult.isRight()).toBe(true);

      if (atDistributionCenterResult.isRight()) {
        const assignedDeliveryPersonId = new UniqueEntityId();
        const anotherDeliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: atDistributionCenterResult.value,
          deliveryPersonId: assignedDeliveryPersonId,
        });

        const result = packageEntity.markAsInTransit(
          new UniqueEntityId(),
          anotherDeliveryPersonId
        );

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(PackageAlreadyAssignedError);
        }
      }
    });

    it('should fail when package is not in at_distribution_center status', () => {
      const deliveryPersonId = new UniqueEntityId();
      const packageEntity = makePackage({ deliveryPersonId });

      const result = packageEntity.markAsInTransit(
        new UniqueEntityId(),
        deliveryPersonId
      );

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
      }
    });
  });

  describe('markAsFailedDelivery', () => {
    it('should mark package as failed delivery successfully', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const attachmentId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
        });

        const result = packageEntity.markAsFailedDelivery(
          deliveryPersonId,
          attachmentId
        );

        expect(result.isRight()).toBe(true);
        expect(packageEntity.status.isFailedDelivery()).toBe(true);
        expect(packageEntity.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should set attachment when marking as failed delivery', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const attachmentId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
          attachment: null,
        });

        packageEntity.markAsFailedDelivery(deliveryPersonId, attachmentId);

        expect(packageEntity.attachment).not.toBeNull();
        expect(packageEntity.attachment?.attachmentId).toBe(attachmentId);
      }
    });

    it('should keep deliveryPersonId after marking as failed delivery', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
        });

        packageEntity.markAsFailedDelivery(
          deliveryPersonId,
          new UniqueEntityId()
        );

        expect(packageEntity.deliveryPersonId).toBe(deliveryPersonId);
      }
    });

    it('should store custom description in history when provided', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
        });

        const customDescription = 'Recipient not home';
        packageEntity.markAsFailedDelivery(
          deliveryPersonId,
          new UniqueEntityId(),
          customDescription
        );

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe(customDescription);
      }
    });

    it('should store default description in history when not provided', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
        });

        packageEntity.markAsFailedDelivery(
          deliveryPersonId,
          new UniqueEntityId()
        );

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe('Package delivery failed');
      }
    });

    it('should add a history entry on marking as failed delivery', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
        });

        const initialCount = packageEntity.histories.getItems().length;
        packageEntity.markAsFailedDelivery(
          deliveryPersonId,
          new UniqueEntityId()
        );

        expect(packageEntity.histories.getItems().length).toBe(
          initialCount + 1
        );
      }
    });

    it('should fail when package has no delivery person assigned', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId: null,
        });

        const result = packageEntity.markAsFailedDelivery(
          new UniqueEntityId(),
          new UniqueEntityId()
        );

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(
            PackageNotAssignedToDeliveryPersonError
          );
        }
      }
    });

    it('should fail when package is assigned to a different delivery person', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const assignedDeliveryPersonId = new UniqueEntityId();
        const anotherDeliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId: assignedDeliveryPersonId,
        });

        const result = packageEntity.markAsFailedDelivery(
          anotherDeliveryPersonId,
          new UniqueEntityId()
        );

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(
            DeliveryPersonNotAssignedToPackageError
          );
        }
      }
    });

    it('should fail when package is not in out_for_delivery status', () => {
      const deliveryPersonId = new UniqueEntityId();
      const packageEntity = makePackage({ deliveryPersonId });

      const result = packageEntity.markAsFailedDelivery(
        deliveryPersonId,
        new UniqueEntityId()
      );

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
      }
    });
  });

  describe('markAsReturned', () => {
    it('should mark package as returned successfully', () => {
      const failedDeliveryResult = PackageStatus.create('failed_delivery');

      expect(failedDeliveryResult.isRight()).toBe(true);

      if (failedDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: failedDeliveryResult.value,
          deliveryPersonId,
        });

        const result = packageEntity.markAsReturned(deliveryPersonId);

        expect(result.isRight()).toBe(true);
        expect(packageEntity.status.isReturned()).toBe(true);
        expect(packageEntity.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should clear deliveryPersonId after marking as returned', () => {
      const failedDeliveryResult = PackageStatus.create('failed_delivery');

      expect(failedDeliveryResult.isRight()).toBe(true);

      if (failedDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: failedDeliveryResult.value,
          deliveryPersonId,
        });

        packageEntity.markAsReturned(deliveryPersonId);

        expect(packageEntity.deliveryPersonId).toBeNull();
      }
    });

    it('should store custom description in history when provided', () => {
      const failedDeliveryResult = PackageStatus.create('failed_delivery');

      expect(failedDeliveryResult.isRight()).toBe(true);

      if (failedDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: failedDeliveryResult.value,
          deliveryPersonId,
        });

        const customDescription = 'Returned to sender';
        packageEntity.markAsReturned(deliveryPersonId, customDescription);

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe(customDescription);
      }
    });

    it('should store default description in history when not provided', () => {
      const failedDeliveryResult = PackageStatus.create('failed_delivery');

      expect(failedDeliveryResult.isRight()).toBe(true);

      if (failedDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: failedDeliveryResult.value,
          deliveryPersonId,
        });

        packageEntity.markAsReturned(deliveryPersonId);

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe('Package returned');
      }
    });

    it('should add a history entry on marking as returned', () => {
      const failedDeliveryResult = PackageStatus.create('failed_delivery');

      expect(failedDeliveryResult.isRight()).toBe(true);

      if (failedDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: failedDeliveryResult.value,
          deliveryPersonId,
        });

        const initialCount = packageEntity.histories.getItems().length;
        packageEntity.markAsReturned(deliveryPersonId);

        expect(packageEntity.histories.getItems().length).toBe(
          initialCount + 1
        );
      }
    });

    it('should fail when package has no delivery person assigned', () => {
      const failedDeliveryResult = PackageStatus.create('failed_delivery');

      expect(failedDeliveryResult.isRight()).toBe(true);

      if (failedDeliveryResult.isRight()) {
        const packageEntity = makePackage({
          status: failedDeliveryResult.value,
          deliveryPersonId: null,
        });

        const result = packageEntity.markAsReturned(new UniqueEntityId());

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(
            PackageNotAssignedToDeliveryPersonError
          );
        }
      }
    });

    it('should fail when package is assigned to a different delivery person', () => {
      const failedDeliveryResult = PackageStatus.create('failed_delivery');

      expect(failedDeliveryResult.isRight()).toBe(true);

      if (failedDeliveryResult.isRight()) {
        const assignedDeliveryPersonId = new UniqueEntityId();
        const anotherDeliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: failedDeliveryResult.value,
          deliveryPersonId: assignedDeliveryPersonId,
        });

        const result = packageEntity.markAsReturned(anotherDeliveryPersonId);

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(
            DeliveryPersonNotAssignedToPackageError
          );
        }
      }
    });

    it('should fail when package is not in failed_delivery status', () => {
      const deliveryPersonId = new UniqueEntityId();
      const packageEntity = makePackage({ deliveryPersonId });

      const result = packageEntity.markAsReturned(deliveryPersonId);

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
      }
    });
  });

  describe('markAsOutForDelivery', () => {
    it('should mark package as out for delivery successfully', () => {
      const inTransitResult = PackageStatus.create('in_transit');

      expect(inTransitResult.isRight()).toBe(true);

      if (inTransitResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const authorId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: inTransitResult.value,
          deliveryPersonId: null,
        });

        const result = packageEntity.markAsOutForDelivery(
          authorId,
          deliveryPersonId
        );

        expect(result.isRight()).toBe(true);
        expect(packageEntity.status.isOutForDelivery()).toBe(true);
        expect(packageEntity.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should set deliveryPersonId after marking as out for delivery', () => {
      const inTransitResult = PackageStatus.create('in_transit');

      expect(inTransitResult.isRight()).toBe(true);

      if (inTransitResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const authorId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: inTransitResult.value,
          deliveryPersonId: null,
        });

        packageEntity.markAsOutForDelivery(authorId, deliveryPersonId);

        expect(packageEntity.deliveryPersonId).toBe(deliveryPersonId);
      }
    });

    it('should store custom description in history when provided', () => {
      const inTransitResult = PackageStatus.create('in_transit');

      expect(inTransitResult.isRight()).toBe(true);

      if (inTransitResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const authorId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: inTransitResult.value,
          deliveryPersonId: null,
        });

        const customDescription = 'Out for final delivery';
        packageEntity.markAsOutForDelivery(
          authorId,
          deliveryPersonId,
          customDescription
        );

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe(customDescription);
      }
    });

    it('should store default description in history when not provided', () => {
      const inTransitResult = PackageStatus.create('in_transit');

      expect(inTransitResult.isRight()).toBe(true);

      if (inTransitResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const authorId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: inTransitResult.value,
          deliveryPersonId: null,
        });

        packageEntity.markAsOutForDelivery(authorId, deliveryPersonId);

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe('Package is out for delivery');
      }
    });

    it('should add a history entry on marking as out for delivery', () => {
      const inTransitResult = PackageStatus.create('in_transit');

      expect(inTransitResult.isRight()).toBe(true);

      if (inTransitResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const authorId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: inTransitResult.value,
          deliveryPersonId: null,
        });

        const initialCount = packageEntity.histories.getItems().length;
        packageEntity.markAsOutForDelivery(authorId, deliveryPersonId);

        expect(packageEntity.histories.getItems().length).toBe(
          initialCount + 1
        );
      }
    });

    it('should fail when package is not in in_transit status', () => {
      const deliveryPersonId = new UniqueEntityId();
      const packageEntity = makePackage({ deliveryPersonId: null });

      const result = packageEntity.markAsOutForDelivery(
        new UniqueEntityId(),
        deliveryPersonId
      );

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
      }
    });
  });

  describe('markAsDelivered', () => {
    it('should mark package as delivered successfully', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const attachmentId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
        });

        const result = packageEntity.markAsDelivered(
          deliveryPersonId,
          attachmentId
        );

        expect(result.isRight()).toBe(true);
        expect(packageEntity.status.isDelivered()).toBe(true);
        expect(packageEntity.updatedAt).toBeInstanceOf(Date);
      }
    });

    it('should set deliveredAt when marking as delivered', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const attachmentId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
        });

        expect(packageEntity.deliveredAt).toBeNull();

        packageEntity.markAsDelivered(deliveryPersonId, attachmentId);

        expect(packageEntity.deliveredAt).toBeInstanceOf(Date);
      }
    });

    it('should set attachment when marking as delivered', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const attachmentId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
          attachment: null,
        });

        packageEntity.markAsDelivered(deliveryPersonId, attachmentId);

        expect(packageEntity.attachment).not.toBeNull();
        expect(packageEntity.attachment?.attachmentId).toBe(attachmentId);
      }
    });

    it('should store custom description in history when provided', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
        });

        const customDescription = 'Left at the front door';
        packageEntity.markAsDelivered(
          deliveryPersonId,
          new UniqueEntityId(),
          customDescription
        );

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe(customDescription);
      }
    });

    it('should store default description in history when not provided', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
        });

        packageEntity.markAsDelivered(deliveryPersonId, new UniqueEntityId());

        const histories = packageEntity.histories.getItems();
        const lastHistory = histories[histories.length - 1];
        expect(lastHistory.description).toBe('Package was delivered');
      }
    });

    it('should add a history entry on marking as delivered', () => {
      const outForDeliveryResult = PackageStatus.create('out_for_delivery');

      expect(outForDeliveryResult.isRight()).toBe(true);

      if (outForDeliveryResult.isRight()) {
        const deliveryPersonId = new UniqueEntityId();
        const packageEntity = makePackage({
          status: outForDeliveryResult.value,
          deliveryPersonId,
        });

        const initialCount = packageEntity.histories.getItems().length;
        packageEntity.markAsDelivered(deliveryPersonId, new UniqueEntityId());

        expect(packageEntity.histories.getItems().length).toBe(
          initialCount + 1
        );
      }
    });

    it('should fail when package is not in out_for_delivery status', () => {
      const deliveryPersonId = new UniqueEntityId();
      const packageEntity = makePackage({ deliveryPersonId });

      const result = packageEntity.markAsDelivered(
        deliveryPersonId,
        new UniqueEntityId()
      );

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
      }
    });
  });

  describe('update', () => {
    it('should update name and recipientAddress', () => {
      const packageEntity = makePackage({
        name: 'Original name',
        recipientAddress: 'Original address',
      });

      packageEntity.update({
        name: 'New name',
        recipientAddress: 'New address',
      });

      expect(packageEntity.name).toBe('New name');
      expect(packageEntity.recipientAddress).toBe('New address');
    });

    it('should set updatedAt after updating', () => {
      const packageEntity = makePackage();

      packageEntity.update({
        name: 'New name',
        recipientAddress: 'New address',
      });

      expect(packageEntity.updatedAt).toBeInstanceOf(Date);
    });

    it('should add a history entry on update', () => {
      const packageEntity = makePackage();

      const initialCount = packageEntity.histories.getItems().length;
      packageEntity.update({
        name: 'New name',
        recipientAddress: 'New address',
      });

      expect(packageEntity.histories.getItems().length).toBe(initialCount + 1);
    });

    it('should store custom description in history when provided', () => {
      const packageEntity = makePackage();

      packageEntity.update(
        { name: 'New name', recipientAddress: 'New address' },
        'Updated by admin request'
      );

      const histories = packageEntity.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe('Updated by admin request');
    });

    it('should store default description in history when not provided', () => {
      const packageEntity = makePackage();

      packageEntity.update({
        name: 'New name',
        recipientAddress: 'New address',
      });

      const histories = packageEntity.histories.getItems();
      const lastHistory = histories[histories.length - 1];
      expect(lastHistory.description).toBe('Package updated');
    });

    it('should keep the same status after updating', () => {
      const packageEntity = makePackage();
      const originalStatus = packageEntity.status.value;

      packageEntity.update({
        name: 'New name',
        recipientAddress: 'New address',
      });

      expect(packageEntity.status.value).toBe(originalStatus);
    });
  });
});
