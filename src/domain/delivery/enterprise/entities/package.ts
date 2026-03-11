import { Either, left, right } from '@/core/either';
import { AggregateRoot } from '@/core/entities/aggregate-root';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import type { Optional } from '@/core/types/optional';
import { DeliveryPersonNotAssignedToPackageError } from '../../application/use-cases/errors/delivery-person-not-assigned-to-package-error';
import { PackageAlreadyAssignedError } from '../../application/use-cases/errors/package-already-assined-erro';
import { PackageNotAssignedToDeliveryPersonError } from '../../application/use-cases/errors/package-not-assigned-to-delivery-person-error';
import { InvalidatePackageStatusError } from '../../errors/invalidate-package-status-error';

import { PackageAssignedToADeliveryPersonEvent } from '../events/package-assigned-to-a-delivery-person-event';
import { PackageAtDistributionCenterEvent } from '../events/package-at-distribution-center-event';
import { PackageCanceledEvent } from '../events/package-canceled-event';
import { PackagePickedUpEvent } from '../events/package-picked-up-event';
import { PackageRegisteredEvent } from '../events/package-registered-event';
import type { PackageAttachment } from './package-attachment';
import { PackageHistory } from './package-history';
import { PackageCode } from './value-object/package-code';
import { PackageHistoryList } from './value-object/package-history-list';
import { PackageStatus } from './value-object/package-status';
import type { PostalCode } from './value-object/postal-code';

export interface PackageProps {
  id: UniqueEntityId;
  name: string;
  code: PackageCode;
  recipientId: UniqueEntityId;
  recipientAddress: string;
  deliveryPersonId: UniqueEntityId | null;
  authorId: UniqueEntityId;
  status: PackageStatus;
  postalCode: PostalCode;
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

  get postalCode() {
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

  private touch() {
    this.props.updatedAt = new Date();
  }

  public assignDeliveryPerson(
    deliveryPersonId: UniqueEntityId,
    authorId: UniqueEntityId,
    description?: string | null
  ): Either<InvalidatePackageStatusError, PackageStatus> {
    this.props.deliveryPersonId = deliveryPersonId;
    this.touch();

    const awaitingPickupStatus = PackageStatus.create('awaiting_pickup');

    if (awaitingPickupStatus.isLeft()) {
      return left(awaitingPickupStatus.value);
    }

    const transitionResult = this.status.transitionTo(
      awaitingPickupStatus.value
    );

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: authorId,
      createdAt: new Date(),
      deliveryPersonId: this.props.deliveryPersonId,
      description: description ?? 'Package assigned to a delivery person',
      fromStatus: this.status,
      toStatus: awaitingPickupStatus.value,
    });

    this.props.status = awaitingPickupStatus.value;
    this.touch();

    this.addDomainEvent(
      new PackageAssignedToADeliveryPersonEvent(packageHistory, this.id)
    );

    this.histories.add(packageHistory);

    return right(awaitingPickupStatus.value);
  }

  public markAsCanceled(
    authorId: UniqueEntityId,
    description?: string
  ): Either<InvalidatePackageStatusError, PackageStatus> {
    const canceledStatus = PackageStatus.create('canceled');

    if (canceledStatus.isLeft()) {
      return left(canceledStatus.value);
    }

    const transitionResult = this.status.transitionTo(canceledStatus.value);

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: authorId,
      createdAt: new Date(),
      deliveryPersonId: this.props.deliveryPersonId,
      description: description ?? 'Package canceled',
      fromStatus: this.status,
      toStatus: canceledStatus.value,
    });

    this.props.status = canceledStatus.value;
    this.touch();

    this.addDomainEvent(new PackageCanceledEvent(packageHistory, this.id));

    this.histories.add(packageHistory);

    return right(this.props.status);
  }

  public addAttachment(attachment: PackageAttachment): void {
    this.props.attachment = attachment;
    this.touch();
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

    this.addDomainEvent(new PackageRegisteredEvent(packageHistory, this.id));

    this.histories.add(packageHistory);
  }

  public markAsPickedUp(
    deliveryPersonId: UniqueEntityId,
    description?: string
  ): Either<
    | PackageNotAssignedToDeliveryPersonError
    | PackageAlreadyAssignedError
    | InvalidatePackageStatusError,
    PackageStatus
  > {
    if (!this.props.deliveryPersonId) {
      return left(new PackageNotAssignedToDeliveryPersonError());
    }

    if (!this.props.deliveryPersonId.equals(deliveryPersonId)) {
      return left(new PackageAlreadyAssignedError());
    }

    const pickedUpStatus = PackageStatus.create('picked_up');

    if (pickedUpStatus.isLeft()) {
      return left(pickedUpStatus.value);
    }

    const transitionResult = this.status.transitionTo(pickedUpStatus.value);

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: deliveryPersonId,
      createdAt: new Date(),
      deliveryPersonId: deliveryPersonId,
      description: description ?? 'Package picked up',
      fromStatus: this.status,
      toStatus: pickedUpStatus.value,
    });

    this.props.status = pickedUpStatus.value;
    this.props.deliveryPersonId = null;
    this.touch();

    this.addDomainEvent(new PackagePickedUpEvent(packageHistory, this.id));

    this.histories.add(packageHistory);

    return right(this.status);
  }

  public markAtDistributionCenter(
    deliveryPersonId: UniqueEntityId,
    description?: string
  ): Either<
    | PackageNotAssignedToDeliveryPersonError
    | DeliveryPersonNotAssignedToPackageError
    | InvalidatePackageStatusError,
    PackageStatus
  > {
    if (!this.props.deliveryPersonId) {
      return left(new PackageNotAssignedToDeliveryPersonError());
    }

    if (!this.props.deliveryPersonId.equals(deliveryPersonId)) {
      return left(new DeliveryPersonNotAssignedToPackageError());
    }

    const atDistributionCenterStatus = PackageStatus.create(
      'at_distribution_center'
    );

    if (atDistributionCenterStatus.isLeft()) {
      return left(atDistributionCenterStatus.value);
    }

    const transitionResult = this.status.transitionTo(
      atDistributionCenterStatus.value
    );

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: deliveryPersonId,
      createdAt: new Date(),
      deliveryPersonId: deliveryPersonId,
      description: description ?? 'Package marked at distribution center',
      fromStatus: this.status,
      toStatus: atDistributionCenterStatus.value,
    });

    this.props.status = atDistributionCenterStatus.value;
    this.touch();

    this.addDomainEvent(
      new PackageAtDistributionCenterEvent(packageHistory, this.id)
    );

    this.histories.add(packageHistory);

    return right(this.status);
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
