import { UniqueEntityId } from './value-object/unique-entity-id';

export abstract class Entity<Props> {
  // private _domainEvents: DomainEvent[] = [];

  private _id: UniqueEntityId;
  protected props: Props;

  get id() {
    return this._id;
  }

  protected constructor(props: Props, id?: UniqueEntityId) {
    this.props = props;
    this._id = id ?? new UniqueEntityId();
  }

  public equals(entity: unknown) {
    if (entity === this) {
      return true;
    }

    if (entity instanceof Entity && entity._id === this._id) {
      return true;
    }

    return false;
  }

  // get domainEvents() { //TODO:
  //   return this._domainEvents;
  // }

  // protected addDomainEvent(domainEvent: DomainEvent): void {
  //   this._domainEvents.push(domainEvent);
  //   DomainEvents.markEntityForDispatch(this);
  // }

  // public clearEvents() {
  //   this._domainEvents = [];
  // }
}
