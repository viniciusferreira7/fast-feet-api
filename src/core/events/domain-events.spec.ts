import { AggregateRoot } from '../entities/aggregate-root';
import type { UniqueEntityId } from '../entities/value-object/unique-entity-id';
import type { DomainEvent } from './domain-event';
import { DomainEvents } from './domain-events';

class CustomAggregateCreated implements DomainEvent {
  public occurredAt: Date;
  private aggregate: CustomAggregate; //eslint-disable-line

  constructor(aggregate: CustomAggregate) {
    this.aggregate = aggregate;
    this.occurredAt = new Date();
  }

  public getEntityId(): UniqueEntityId {
    return this.aggregate.id;
  }
}

class CustomAggregate extends AggregateRoot<null> {
  static create() {
    const aggregate = new CustomAggregate(null);

    aggregate.addDomainEvent(new CustomAggregateCreated(aggregate));

    return aggregate;
  }
}

describe('Domain events', () => {
  it('should be able to dispatch and listen to events', () => {
    const callbackSpy = vi.fn();

    // Subscriber registered (listen the event of "Entity ex: answer created")
    DomainEvents.register(callbackSpy, CustomAggregateCreated.name);

    // Created entity, but it doesn't save in database
    const aggregate = CustomAggregate.create();

    // Confirm the event was created, however it's not dispatch yet
    expect(aggregate.domainEvents).toHaveLength(1);

    // Entity was saved in database and event was dispatched
    DomainEvents.dispatchEventsForEntity(aggregate.id);

    // The subscriber was listen the event and do do what needs to be done
    expect(callbackSpy).toBeCalled();
    expect(aggregate.domainEvents).toHaveLength(0);
  });
});
