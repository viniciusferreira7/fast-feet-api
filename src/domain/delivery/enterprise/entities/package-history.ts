import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import type { PackageStatus } from './value-object/package-status';

export interface PackageHistoryProps {
  packageId: UniqueEntityId;
  fromStatus: PackageStatus | null;
  toStatus: PackageStatus;
  authorId: UniqueEntityId;
  deliveryPersonId: UniqueEntityId | null;
  description: string | null;
  createdAt: Date;
}

export class PackageHistory extends Entity<PackageHistoryProps> {
  get packageId() {
    return this.props.packageId;
  }

  get fromStatus() {
    return this.props.fromStatus;
  }

  get toStatus() {
    return this.props.toStatus;
  }

  get authorId() {
    return this.props.authorId;
  }

  get deliveryPersonId() {
    return this.props.deliveryPersonId;
  }

  get description() {
    return this.props.description;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  public static create(
    props: Optional<PackageHistoryProps, 'createdAt'>,
    id?: UniqueEntityId
  ): PackageHistory {
    const packageHistory = new PackageHistory(
      {
        ...props,
        createdAt: props?.createdAt ?? new Date(),
      },
      id
    );

    return packageHistory;
  }
}
