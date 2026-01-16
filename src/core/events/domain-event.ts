import type { UniqueEntityId } from '../entities/value-object/unique-entity-id';

export interface DomainEvent {
  occurredAt: Date;
  getEntityId(): UniqueEntityId;
}
