import type { Entity } from '../entities/entity';
import type { UniqueEntityId } from '../entities/value-object/unique-entity-id';
import { DomainEvent } from './domain-event';

type DomainEventCallback = (event: unknown) => void;

export class DomainEvents {
  private static handlersMap: Record<string, DomainEventCallback[]> = {};
  private static markedEntities: Entity<unknown>[] = [];

  public static shouldRun = true;

  public static markEntityForDispatch(entity: Entity<unknown>) {
    const entityFound = !!DomainEvents.findMarkedEntityByID(entity.id);

    if (!entityFound) {
      DomainEvents.markedEntities.push(entity);
    }
  }

  private static dispatchEntityEvents(entity: Entity<unknown>) {
    entity.domainEvents.forEach((event: DomainEvent) => {
      DomainEvents.dispatch(event);
    });
  }

  private static removeEntityFromMarkedDispatchList(entity: Entity<unknown>) {
    const index = DomainEvents.markedEntities.findIndex((a) =>
      a.equals(entity)
    );

    DomainEvents.markedEntities.splice(index, 1);
  }

  private static findMarkedEntityByID(
    id: UniqueEntityId
  ): Entity<unknown> | undefined {
    return DomainEvents.markedEntities.find((entity) => entity.id.equals(id));
  }

  public static dispatchEventsForEntity(id: UniqueEntityId) {
    const entity = DomainEvents.findMarkedEntityByID(id);

    if (entity) {
      DomainEvents.dispatchEntityEvents(entity);
      entity.clearEvents();
      DomainEvents.removeEntityFromMarkedDispatchList(entity);
    }
  }

  public static register(
    callback: DomainEventCallback,
    eventClassName: string
  ) {
    const wasEventRegisteredBefore = eventClassName in DomainEvents.handlersMap;

    if (!wasEventRegisteredBefore) {
      DomainEvents.handlersMap[eventClassName] = [];
    }

    DomainEvents.handlersMap[eventClassName].push(callback);
  }

  public static clearHandlers() {
    DomainEvents.handlersMap = {};
  }

  public static clearMarkedEntities() {
    DomainEvents.markedEntities = [];
  }

  private static dispatch(event: DomainEvent) {
    const eventClassName: string = event.constructor.name;

    const isEventRegistered = eventClassName in DomainEvents.handlersMap;

    if (!DomainEvents.shouldRun) return;

    if (isEventRegistered) {
      const handlers = DomainEvents.handlersMap[eventClassName];

      for (const handler of handlers) {
        handler(event);
      }
    }
  }
}
