import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { DomainEvent } from '@/core/events/domain-event';
import type { PackageHistory } from '../entities/package-history';

export class PackageHistoryCreatedEvent implements DomainEvent {
  public occurredAt: Date;
  public packageHistory: PackageHistory;
  public packageId: UniqueEntityId;

  constructor(packageHistory: PackageHistory, packageId: UniqueEntityId) {
    this.occurredAt = new Date();
    this.packageHistory = packageHistory;
    this.packageId = packageId;
  }

  public getEntityId(): UniqueEntityId {
    return this.packageHistory.id;
  }
}
