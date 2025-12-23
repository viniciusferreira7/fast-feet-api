import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { PackageCode } from '../value-object/package-code';
import { PackageStatus } from '../value-object/package-status';
import type { PackageAttachment } from './package-attachment';

export interface PackageProps {
  id: UniqueEntityId;
  code: PackageCode;
  recipientName: string;
  recipientAddress: string;
  deliveryPersonId: UniqueEntityId | null;
  status: PackageStatus;
  attachment: PackageAttachment;
  createdAt: Date;
  updatedAt: Date | null;
  deliveredAt: Date | null;
}

export class Package extends AggregateRoot<PackageProps> {
  get id() {
    return this.props.id;
  }

  get code() {
    return this.props.code;
  }

  get recipientName() {
    return this.props.recipientName;
  }

  get recipientAddress() {
    return this.props.recipientAddress;
  }

  get deliveryPersonId() {
    return this.props.deliveryPersonId;
  }

  get status() {
    return this.props.status;
  }

  get attachment() {
    return this.props.attachment;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get deliveredAt() {
    return this.props.deliveredAt;
  }

  public updateStatus(newStatus: PackageStatus): void {
    this.props.status = this.props.status.transitionTo(newStatus);
    this.props.updatedAt = new Date();

    if (newStatus.isDelivered()) {
      this.props.deliveredAt = new Date();
    }
  }

  public assignDeliveryPerson(deliveryPersonId: UniqueEntityId): void {
    this.props.deliveryPersonId = deliveryPersonId;
    this.props.updatedAt = new Date();
  }

  public static create(
    props: Optional<PackageProps, 'createdAt'>,
    id?: UniqueEntityId
  ) {
    return new Package(
      {
        ...props,
        code: props.code ?? PackageCode.generate(),
        status: props.status ?? PackageStatus.create('pending'),
        deliveryPersonId: props.deliveryPersonId ?? null,
        createdAt: props?.createdAt ?? new Date(),
        updatedAt: null,
        deliveredAt: null,
      },
      id
    );
  }
}
