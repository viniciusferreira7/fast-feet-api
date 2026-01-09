import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { ValueObject } from '@/core/entities/value-object/value-object';
import type { PackageStatus } from './package-status';

export interface PackageHistoryProps {
  packageId: UniqueEntityId;
  packageStatus: PackageStatus;
  authorId: UniqueEntityId;
  createdAt: Date;
}

export class PackageHistory extends ValueObject<PackageHistoryProps> {
  get packageId() {
    return this.props.packageId;
  }

  get packageStatus() {
    return this.props.packageStatus;
  }

  get authorId() {
    return this.props.authorId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  public static create(props: PackageHistoryProps): PackageHistory {
    return new PackageHistory(props);
  }
}
