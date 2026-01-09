import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import { PackageStatus } from './package-status';

describe('Package Status', () => {
  describe('create', () => {
    it('should be able to create validate package status', () => {
      const status = PackageStatus.create('pending');

      expect(status).toBeInstanceOf(PackageStatus);
      expect(status.value).toBe('pending');
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
        const status = PackageStatus.create(statusValue);
        expect(status).toBeInstanceOf(PackageStatus);
        expect(status.value).toBe(statusValue);
      });
    });

    it('should not be able to create invalidate package status', () => {
      expect(() => PackageStatus.create('invalid_status')).toThrow(
        InvalidatePackageStatusError
      );
    });

    it('should not be able to create package status with empty string', () => {
      expect(() => PackageStatus.create('')).toThrow(
        InvalidatePackageStatusError
      );
    });
  });

  describe('canTransitionTo', () => {
    it('should allow valid transition from pending to awaiting_pickup', () => {
      const currentStatus = PackageStatus.create('pending');
      const newStatus = PackageStatus.create('awaiting_pickup');

      expect(currentStatus.canTransitionTo(newStatus)).toBe(true);
    });

    it('should allow valid transition from pending to canceled', () => {
      const currentStatus = PackageStatus.create('pending');
      const newStatus = PackageStatus.create('canceled');

      expect(currentStatus.canTransitionTo(newStatus)).toBe(true);
    });

    it('should not allow invalid transition from pending to delivered', () => {
      const currentStatus = PackageStatus.create('pending');
      const newStatus = PackageStatus.create('delivered');

      expect(currentStatus.canTransitionTo(newStatus)).toBe(false);
    });

    it('should not allow transition from delivered to any status', () => {
      const currentStatus = PackageStatus.create('delivered');
      const newStatus = PackageStatus.create('pending');

      expect(currentStatus.canTransitionTo(newStatus)).toBe(false);
    });

    it('should allow transition from in_transit back to at_distribution_center', () => {
      const currentStatus = PackageStatus.create('in_transit');
      const newStatus = PackageStatus.create('at_distribution_center');

      expect(currentStatus.canTransitionTo(newStatus)).toBe(true);
    });
  });

  describe('transitionTo', () => {
    it('should successfully transition to valid status', () => {
      const currentStatus = PackageStatus.create('pending');
      const newStatus = PackageStatus.create('awaiting_pickup');

      const transitionedStatus = currentStatus.transitionTo(newStatus);

      expect(transitionedStatus).toBe(newStatus);
      expect(transitionedStatus.value).toBe('awaiting_pickup');
    });

    it('should throw error when transitioning to invalid status', () => {
      const currentStatus = PackageStatus.create('pending');
      const newStatus = PackageStatus.create('delivered');

      expect(() => currentStatus.transitionTo(newStatus)).toThrow(
        InvalidatePackageStatusError
      );
    });
  });

  describe('status check methods', () => {
    it('should correctly identify pending status', () => {
      const status = PackageStatus.create('pending');

      expect(status.isPending()).toBe(true);
      expect(status.isAwaitingPickup()).toBe(false);
      expect(status.isDelivered()).toBe(false);
    });

    it('should correctly identify awaiting_pickup status', () => {
      const status = PackageStatus.create('awaiting_pickup');

      expect(status.isAwaitingPickup()).toBe(true);
      expect(status.isPending()).toBe(false);
      expect(status.isPickedUp()).toBe(false);
    });

    it('should correctly identify picked_up status', () => {
      const status = PackageStatus.create('picked_up');

      expect(status.isPickedUp()).toBe(true);
      expect(status.isAwaitingPickup()).toBe(false);
    });

    it('should correctly identify at_distribution_center status', () => {
      const status = PackageStatus.create('at_distribution_center');

      expect(status.isAtDistributionCenter()).toBe(true);
      expect(status.isInTransit()).toBe(false);
    });

    it('should correctly identify in_transit status', () => {
      const status = PackageStatus.create('in_transit');

      expect(status.isInTransit()).toBe(true);
      expect(status.isAtDistributionCenter()).toBe(false);
    });

    it('should correctly identify out_for_delivery status', () => {
      const status = PackageStatus.create('out_for_delivery');

      expect(status.isOutForDelivery()).toBe(true);
      expect(status.isInTransit()).toBe(false);
    });

    it('should correctly identify delivered status', () => {
      const status = PackageStatus.create('delivered');

      expect(status.isDelivered()).toBe(true);
      expect(status.isOutForDelivery()).toBe(false);
    });

    it('should correctly identify failed_delivery status', () => {
      const status = PackageStatus.create('failed_delivery');

      expect(status.isFailedDelivery()).toBe(true);
      expect(status.isDelivered()).toBe(false);
    });

    it('should correctly identify returned status', () => {
      const status = PackageStatus.create('returned');

      expect(status.isReturned()).toBe(true);
      expect(status.isDelivered()).toBe(false);
    });

    it('should correctly identify canceled status', () => {
      const status = PackageStatus.create('canceled');

      expect(status.isCanceled()).toBe(true);
      expect(status.isPending()).toBe(false);
    });
  });

  describe('isFinalState', () => {
    it('should return true for delivered status', () => {
      const status = PackageStatus.create('delivered');

      expect(status.isFinalState()).toBe(true);
    });

    it('should return true for returned status', () => {
      const status = PackageStatus.create('returned');

      expect(status.isFinalState()).toBe(true);
    });

    it('should return true for canceled status', () => {
      const status = PackageStatus.create('canceled');

      expect(status.isFinalState()).toBe(true);
    });

    it('should return false for pending status', () => {
      const status = PackageStatus.create('pending');

      expect(status.isFinalState()).toBe(false);
    });

    it('should return false for in_transit status', () => {
      const status = PackageStatus.create('in_transit');

      expect(status.isFinalState()).toBe(false);
    });

    it('should return false for out_for_delivery status', () => {
      const status = PackageStatus.create('out_for_delivery');

      expect(status.isFinalState()).toBe(false);
    });
  });
});
