import { Either, left, right } from '@/core/either';
import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import { MissingAttachmentError } from '../../errors/missing-attachment-error';
import { PackageAssignedToADeliveryPersonEvent } from '../events/package-assigned-to-a-delivery-person-event';
import type { PackageAttachment } from './package-attachment';
import { PackageHistory } from './package-history';
import { PackageCode } from './value-object/package-code';
import type { PackageHistoryList } from './value-object/package-history-list';
import { PackageStatus } from './value-object/package-status';

export interface PackageProps {
  id: UniqueEntityId;
  code: PackageCode;
  recipientName: string;
  recipientAddress: string;
  deliveryPersonId: UniqueEntityId | null;
  authorId: UniqueEntityId;
  status: PackageStatus;
  attachment?: PackageAttachment | null;
  createdAt: Date;
  updatedAt: Date | null;
  deliveredAt: Date | null;
  histories: PackageHistoryList;
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

  get authorId() {
    return this.props.authorId;
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
  get histories() {
    return this.props.histories;
  }

  public updateStatus(
    newStatus: PackageStatus,
    authorId: UniqueEntityId
  ): Either<MissingAttachmentError | InvalidatePackageStatusError, void> {
    if (newStatus.isDelivered() && !this.props.attachment) {
      return left(new MissingAttachmentError());
    }

    const transitionResult = this.props.status.transitionTo(newStatus);

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: authorId,
      createdAt: new Date(),
      deliveryPersonId: this.props.deliveryPersonId,
      description: 'Package status changed',
      fromStatus: this.props.status,
      toStatus: transitionResult.value,
    });

    this.props.status = transitionResult.value;
    this.props.updatedAt = new Date();

    if (newStatus.isDelivered()) {
      this.props.deliveredAt = new Date();
    }

    this.histories.add(packageHistory);

    return right(undefined);
  }

  public assignDeliveryPerson(
    deliveryPersonId: UniqueEntityId,
    authorId: UniqueEntityId,
    previousStatus: PackageStatus
  ): void {
    this.props.deliveryPersonId = deliveryPersonId;
    this.props.updatedAt = new Date();

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: authorId,
      createdAt: new Date(),
      deliveryPersonId: this.props.deliveryPersonId,
      description: 'Package assigned to a delivery person',
      fromStatus: previousStatus,
      toStatus: this.status,
    });

    this.addDomainEvent(
      new PackageAssignedToADeliveryPersonEvent(packageHistory, this.id)
    );

    this.histories.add(packageHistory);
  }

  public addAttachment(attachment: PackageAttachment): void {
    this.props.attachment = attachment;
    this.props.updatedAt = new Date();
  }

  public static create(
    props: Optional<PackageProps, 'createdAt' | 'updatedAt' | 'deliveredAt'>,
    id?: UniqueEntityId
  ) {
    let code: PackageCode;
    if (props.code) {
      code = props.code;
    } else {
      const codeResult = PackageCode.generate();
      if (codeResult.isLeft()) {
        throw new Error('Failed to generate package code');
      }
      code = codeResult.value;
    }

    let status: PackageStatus;
    if (props.status) {
      status = props.status;
    } else {
      const statusResult = PackageStatus.create('pending');
      if (statusResult.isLeft()) {
        throw new Error('Failed to create default pending status');
      }
      status = statusResult.value;
    }

    return new Package(
      {
        ...props,
        code,
        status,
        deliveryPersonId: props.deliveryPersonId ?? null,
        attachment: props.attachment ?? null,
        createdAt: props?.createdAt ?? new Date(),
        updatedAt: props?.updatedAt ?? null,
        deliveredAt: props?.deliveredAt ?? null,
        histories: props.histories,
      },
      id
    );
  }
}
