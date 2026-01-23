import { Either, left, right } from '@/core/either';
import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';
import { MissingAttachmentError } from '../../errors/missing-attachment-error';
import { PackageAssignedToADeliveryPersonEvent } from '../events/package-assigned-to-a-delivery-person-event';
import { PackageRegisteredEvent } from '../events/package-registered-event';
import type { PackageAttachment } from './package-attachment';
import { PackageHistory } from './package-history';
import { PackageCode } from './value-object/package-code';
import { PackageHistoryList } from './value-object/package-history-list';
import { PackageStatus } from './value-object/package-status';
import type { PostCode } from './value-object/post-code';

export interface PackageProps {
  id: UniqueEntityId;
  name: string;
  code: PackageCode;
  recipientId: UniqueEntityId;
  recipientAddress: string;
  deliveryPersonId: UniqueEntityId | null;
  authorId: UniqueEntityId;
  status: PackageStatus;
  postalCode: PostCode;
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

  get name() {
    return this.props.name;
  }
  get code() {
    return this.props.code;
  }

  get recipientId() {
    return this.props.recipientId;
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

  get postCode() {
    return this.props.postalCode;
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
    authorId: UniqueEntityId,
    description?: string | null
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
      description: description ?? 'Package status changed',
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
    previousStatus: PackageStatus,
    description?: string | null
  ): void {
    this.props.deliveryPersonId = deliveryPersonId;
    this.props.updatedAt = new Date();

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: authorId,
      createdAt: new Date(),
      deliveryPersonId: this.props.deliveryPersonId,
      description: description ?? 'Package assigned to a delivery person',
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

  public markAsRegistered(authorId: UniqueEntityId): void {
    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: authorId,
      createdAt: new Date(),
      deliveryPersonId: this.props.deliveryPersonId,
      description: 'Package registered',
      fromStatus: null,
      toStatus: this.status,
    });

    this.addDomainEvent(
      new PackageRegisteredEvent(packageHistory, this.id)
    );

    this.histories.add(packageHistory);
  }

  public static create(
    props: Optional<PackageProps, 'createdAt' | 'updatedAt' | 'deliveredAt'>,
    id?: UniqueEntityId
  ): Either<InvalidatePackageStatusError, Package> {
    let code: PackageCode;
    if (props.code) {
      code = props.code;
    } else {
      const codeResult = PackageCode.generate();
      if (codeResult.isLeft()) {
        return left(codeResult.value);
      }
      code = codeResult.value;
    }

    let status: PackageStatus;
    if (props.status) {
      status = props.status;
    } else {
      const statusResult = PackageStatus.create('pending');
      if (statusResult.isLeft()) {
        return left(statusResult.value);
      }
      status = statusResult.value;
    }

    return right(
      new Package(
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
      )
    );
  }
}
