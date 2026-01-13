import { InvalidatePackageStatusError } from '@/domain/delivery/errors/invalidate-package-status-error';
import { PackageStatus } from './package-status';

describe('Package Status', () => {
  describe('create', () => {
    it('should be able to create validate package status', () => {
      const result = PackageStatus.create('pending');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value).toBeInstanceOf(PackageStatus);
        expect(result.value.value).toBe('pending');
      }
    });

    it('should be able to create all valid statuses', () => {
      const validStatuses = [
        'pending',
        'awaiting_pickup',
        'picked_up',
        'at_distribution_center',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'failed_delivery',
        'returned',
        'canceled',
      ];

      validStatuses.forEach((statusValue) => {
        const result = PackageStatus.create(statusValue);

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value).toBeInstanceOf(PackageStatus);
          expect(result.value.value).toBe(statusValue);
        }
      });
    });

    it('should not be able to create invalidate package status', () => {
      const result = PackageStatus.create('invalid_status');

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
      }
    });

    it('should not be able to create package status with empty string', () => {
      const result = PackageStatus.create('');

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidatePackageStatusError);
      }
    });
  });

  describe('canTransitionTo', () => {
    it('should allow valid transition from pending to awaiting_pickup', () => {
      const currentStatusResult = PackageStatus.create('pending');
      const newStatusResult = PackageStatus.create('awaiting_pickup');

      expect(currentStatusResult.isRight()).toBe(true);
      expect(newStatusResult.isRight()).toBe(true);

      if (currentStatusResult.isRight() && newStatusResult.isRight()) {
        expect(
          currentStatusResult.value.canTransitionTo(newStatusResult.value)
        ).toBe(true);
      }
    });

    it('should allow valid transition from pending to canceled', () => {
      const currentStatusResult = PackageStatus.create('pending');
      const newStatusResult = PackageStatus.create('canceled');

      expect(currentStatusResult.isRight()).toBe(true);
      expect(newStatusResult.isRight()).toBe(true);

      if (currentStatusResult.isRight() && newStatusResult.isRight()) {
        expect(
          currentStatusResult.value.canTransitionTo(newStatusResult.value)
        ).toBe(true);
      }
    });

    it('should not allow invalid transition from pending to delivered', () => {
      const currentStatusResult = PackageStatus.create('pending');
      const newStatusResult = PackageStatus.create('delivered');

      expect(currentStatusResult.isRight()).toBe(true);
      expect(newStatusResult.isRight()).toBe(true);

      if (currentStatusResult.isRight() && newStatusResult.isRight()) {
        expect(
          currentStatusResult.value.canTransitionTo(newStatusResult.value)
        ).toBe(false);
      }
    });

    it('should not allow transition from delivered to any status', () => {
      const currentStatusResult = PackageStatus.create('delivered');
      const newStatusResult = PackageStatus.create('pending');

      expect(currentStatusResult.isRight()).toBe(true);
      expect(newStatusResult.isRight()).toBe(true);

      if (currentStatusResult.isRight() && newStatusResult.isRight()) {
        expect(
          currentStatusResult.value.canTransitionTo(newStatusResult.value)
        ).toBe(false);
      }
    });

    it('should allow transition from in_transit back to at_distribution_center', () => {
      const currentStatusResult = PackageStatus.create('in_transit');
      const newStatusResult = PackageStatus.create('at_distribution_center');

      expect(currentStatusResult.isRight()).toBe(true);
      expect(newStatusResult.isRight()).toBe(true);

      if (currentStatusResult.isRight() && newStatusResult.isRight()) {
        expect(
          currentStatusResult.value.canTransitionTo(newStatusResult.value)
        ).toBe(true);
      }
    });
  });

  describe('transitionTo', () => {
    it('should successfully transition to valid status', () => {
      const currentStatusResult = PackageStatus.create('pending');
      const newStatusResult = PackageStatus.create('awaiting_pickup');

      expect(currentStatusResult.isRight()).toBe(true);
      expect(newStatusResult.isRight()).toBe(true);

      if (currentStatusResult.isRight() && newStatusResult.isRight()) {
        const transitionResult = currentStatusResult.value.transitionTo(
          newStatusResult.value
        );

        expect(transitionResult.isRight()).toBe(true);
        if (transitionResult.isRight()) {
          expect(transitionResult.value).toBe(newStatusResult.value);
          expect(transitionResult.value.value).toBe('awaiting_pickup');
        }
      }
    });

    it('should return error when transitioning to invalid status', () => {
      const currentStatusResult = PackageStatus.create('pending');
      const newStatusResult = PackageStatus.create('delivered');

      expect(currentStatusResult.isRight()).toBe(true);
      expect(newStatusResult.isRight()).toBe(true);

      if (currentStatusResult.isRight() && newStatusResult.isRight()) {
        const transitionResult = currentStatusResult.value.transitionTo(
          newStatusResult.value
        );

        expect(transitionResult.isLeft()).toBe(true);
        if (transitionResult.isLeft()) {
          expect(transitionResult.value).toBeInstanceOf(
            InvalidatePackageStatusError
          );
        }
      }
    });
  });

  describe('status check methods', () => {
    it('should correctly identify pending status', () => {
      const result = PackageStatus.create('pending');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isPending()).toBe(true);
        expect(result.value.isAwaitingPickup()).toBe(false);
        expect(result.value.isDelivered()).toBe(false);
      }
    });

    it('should correctly identify awaiting_pickup status', () => {
      const result = PackageStatus.create('awaiting_pickup');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isAwaitingPickup()).toBe(true);
        expect(result.value.isPending()).toBe(false);
        expect(result.value.isPickedUp()).toBe(false);
      }
    });

    it('should correctly identify picked_up status', () => {
      const result = PackageStatus.create('picked_up');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isPickedUp()).toBe(true);
        expect(result.value.isAwaitingPickup()).toBe(false);
      }
    });

    it('should correctly identify at_distribution_center status', () => {
      const result = PackageStatus.create('at_distribution_center');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isAtDistributionCenter()).toBe(true);
        expect(result.value.isInTransit()).toBe(false);
      }
    });

    it('should correctly identify in_transit status', () => {
      const result = PackageStatus.create('in_transit');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isInTransit()).toBe(true);
        expect(result.value.isAtDistributionCenter()).toBe(false);
      }
    });

    it('should correctly identify out_for_delivery status', () => {
      const result = PackageStatus.create('out_for_delivery');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isOutForDelivery()).toBe(true);
        expect(result.value.isInTransit()).toBe(false);
      }
    });

    it('should correctly identify delivered status', () => {
      const result = PackageStatus.create('delivered');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isDelivered()).toBe(true);
        expect(result.value.isOutForDelivery()).toBe(false);
      }
    });

    it('should correctly identify failed_delivery status', () => {
      const result = PackageStatus.create('failed_delivery');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isFailedDelivery()).toBe(true);
        expect(result.value.isDelivered()).toBe(false);
      }
    });

    it('should correctly identify returned status', () => {
      const result = PackageStatus.create('returned');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isReturned()).toBe(true);
        expect(result.value.isDelivered()).toBe(false);
      }
    });

    it('should correctly identify canceled status', () => {
      const result = PackageStatus.create('canceled');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isCanceled()).toBe(true);
        expect(result.value.isPending()).toBe(false);
      }
    });
  });

  describe('isFinalState', () => {
    it('should return true for delivered status', () => {
      const result = PackageStatus.create('delivered');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isFinalState()).toBe(true);
      }
    });

    it('should return true for returned status', () => {
      const result = PackageStatus.create('returned');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isFinalState()).toBe(true);
      }
    });

    it('should return true for canceled status', () => {
      const result = PackageStatus.create('canceled');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isFinalState()).toBe(true);
      }
    });

    it('should return false for pending status', () => {
      const result = PackageStatus.create('pending');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isFinalState()).toBe(false);
      }
    });

    it('should return false for in_transit status', () => {
      const result = PackageStatus.create('in_transit');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isFinalState()).toBe(false);
      }
    });

    it('should return false for out_for_delivery status', () => {
      const result = PackageStatus.create('out_for_delivery');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.isFinalState()).toBe(false);
      }
    });
  });
});
