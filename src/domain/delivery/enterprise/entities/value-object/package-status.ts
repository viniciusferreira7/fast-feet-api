import { Either, left, right } from '@/core/either';
import { ValueObject } from '@/core/entities/value-object/value-object';
import { InvalidatePackageStatusError } from '@/domain/delivery/errors/invalidate-package-status-error';

export type Status =
  | 'pending'
  | 'awaiting_pickup'
  | 'picked_up'
  | 'at_distribution_center'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed_delivery'
  | 'returned'
  | 'canceled';

interface PackageStatusProps {
  value: Status;
}

export class PackageStatus extends ValueObject<PackageStatusProps> {
  private static readonly VALID_STATUSES: Status[] = [
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
  ] as const;

  private static readonly VALID_TRANSITIONS: Record<Status, readonly Status[]> =
    {
      pending: ['awaiting_pickup', 'canceled'],
      awaiting_pickup: ['picked_up', 'canceled'],
      picked_up: ['at_distribution_center', 'canceled'],
      at_distribution_center: ['in_transit', 'canceled'],
      in_transit: ['out_for_delivery', 'at_distribution_center', 'canceled'],
      out_for_delivery: ['delivered', 'failed_delivery', 'canceled'],
      failed_delivery: ['out_for_delivery', 'returned'],
      delivered: [],
      returned: [],
      canceled: [],
    };

  get value(): Status {
    return this.props.value;
  }

  private static validate(status: Status): boolean {
    return PackageStatus.VALID_STATUSES.includes(
      status as (typeof this.VALID_STATUSES)[number]
    );
  }

  public static create(
    value: Status
  ): Either<InvalidatePackageStatusError, PackageStatus> {
    if (!PackageStatus.validate(value)) {
      return left(new InvalidatePackageStatusError());
    }

    return right(new PackageStatus({ value }));
  }

  public canTransitionTo(newStatus: PackageStatus): boolean {
    const allowedTransitions =
      PackageStatus.VALID_TRANSITIONS[this.props.value] || [];
    return allowedTransitions.includes(newStatus.value);
  }

  public transitionTo(
    newStatus: PackageStatus
  ): Either<InvalidatePackageStatusError, PackageStatus> {
    if (!this.canTransitionTo(newStatus)) {
      return left(new InvalidatePackageStatusError());
    }
    return right(newStatus);
  }

  public isPending(): boolean {
    return this.props.value === 'pending';
  }

  public isAwaitingPickup(): boolean {
    return this.props.value === 'awaiting_pickup';
  }

  public isPickedUp(): boolean {
    return this.props.value === 'picked_up';
  }

  public isAtDistributionCenter(): boolean {
    return this.props.value === 'at_distribution_center';
  }

  public isInTransit(): boolean {
    return this.props.value === 'in_transit';
  }

  public isOutForDelivery(): boolean {
    return this.props.value === 'out_for_delivery';
  }

  public isDelivered(): boolean {
    return this.props.value === 'delivered';
  }

  public isFailedDelivery(): boolean {
    return this.props.value === 'failed_delivery';
  }

  public isReturned(): boolean {
    return this.props.value === 'returned';
  }

  public isCanceled(): boolean {
    return this.props.value === 'canceled';
  }

  public isFinalState(): boolean {
    return this.isDelivered() || this.isReturned() || this.isCanceled();
  }
}
