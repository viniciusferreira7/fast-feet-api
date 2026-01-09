import { Either, left, right } from '@/core/either';
import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { MissingAttachmentError } from '../../errors/missing-attachment-error';
import type { PackageAttachment } from './package-attachment';
import { PackageCode } from './value-object/package-code';
import { PackageStatus } from './value-object/package-status';

export interface PackageProps {
  id: UniqueEntityId;
  code: PackageCode;
  recipientName: string;
  recipientAddress: string;
  deliveryPersonId: UniqueEntityId | null;
  status: PackageStatus;
  attachment: PackageAttachment | null;
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

  public updateStatus(
    newStatus: PackageStatus
  ): Either<MissingAttachmentError, void> {
    if (newStatus.isDelivered() && !this.props.attachment) {
      return left(new MissingAttachmentError());
    }

    this.props.status = this.props.status.transitionTo(newStatus);
    this.props.updatedAt = new Date();

    if (newStatus.isDelivered()) {
      this.props.deliveredAt = new Date();
    }

    return right(undefined);
  }

  public assignDeliveryPerson(deliveryPersonId: UniqueEntityId): void {
    this.props.deliveryPersonId = deliveryPersonId;
    this.props.updatedAt = new Date();
  }

  public addAttachment(attachment: PackageAttachment): void {
    this.props.attachment = attachment;
    this.props.updatedAt = new Date();
  }

  public static create(
    props: Optional<PackageProps, 'createdAt' | 'updatedAt' | 'deliveredAt'>,
    id?: UniqueEntityId
  ) {
    return new Package(
      {
        ...props,
        code: props.code ?? PackageCode.generate(),
        status: props.status ?? PackageStatus.create('pending'),
        deliveryPersonId: props.deliveryPersonId ?? null,
        createdAt: props?.createdAt ?? new Date(),
        updatedAt: props?.updatedAt ?? null,
        deliveredAt: props?.deliveredAt ?? null,
      },
      id
    );
  }
}
