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
import { PackageFailedDeliveryEvent } from '../events/package-failed-delivery-event';
import { PackageIsInTransitEvent } from '../events/package-is-in-transit-event';
import { PackageIsOutForDeliveryEvent } from '../events/package-is-out-for-delivery-event';
import { PackagePickedUpEvent } from '../events/package-picked-up-event';
import { PackageRegisteredEvent } from '../events/package-registered-event';
import { PackageReturnedEvent } from '../events/package-returned-event';
import { PackageWasDeliveredEvent } from '../events/package-was-delivered-event';
import { PackageAttachment } from './package-attachment';
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

  public markAsInTransit(
    authorId: UniqueEntityId,
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

    const inTransitStatus = PackageStatus.create('in_transit');

    if (inTransitStatus.isLeft()) {
      return left(inTransitStatus.value);
    }

    const transitionResult = this.status.transitionTo(inTransitStatus.value);

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: authorId,
      createdAt: new Date(),
      deliveryPersonId: deliveryPersonId,
      description: description ?? 'Package is in transit',
      fromStatus: this.status,
      toStatus: inTransitStatus.value,
    });

    this.props.status = inTransitStatus.value;
    this.props.deliveryPersonId = null;
    this.touch();

    this.addDomainEvent(new PackageIsInTransitEvent(packageHistory, this.id));

    this.histories.add(packageHistory);

    return right(this.status);
  }

  public markAsFailedDelivery(
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

    const failedDeliveryStatus = PackageStatus.create('failed_delivery');

    if (failedDeliveryStatus.isLeft()) {
      return left(failedDeliveryStatus.value);
    }

    const transitionResult = this.status.transitionTo(
      failedDeliveryStatus.value
    );

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: deliveryPersonId,
      createdAt: new Date(),
      deliveryPersonId: deliveryPersonId,
      description: description ?? 'Package delivery failed',
      fromStatus: this.status,
      toStatus: failedDeliveryStatus.value,
    });

    this.props.status = failedDeliveryStatus.value;
    this.touch();

    this.addDomainEvent(
      new PackageFailedDeliveryEvent(packageHistory, this.id)
    );

    this.histories.add(packageHistory);

    return right(this.props.status);
  }

  public markAsReturned(
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

    const returnedStatus = PackageStatus.create('returned');

    if (returnedStatus.isLeft()) {
      return left(returnedStatus.value);
    }

    const transitionResult = this.status.transitionTo(returnedStatus.value);

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: deliveryPersonId,
      createdAt: new Date(),
      deliveryPersonId: deliveryPersonId,
      description: description ?? 'Package returned',
      fromStatus: this.status,
      toStatus: returnedStatus.value,
    });

    this.props.status = returnedStatus.value;
    this.props.deliveryPersonId = null;
    this.touch();

    this.addDomainEvent(new PackageReturnedEvent(packageHistory, this.id));

    this.histories.add(packageHistory);

    return right(this.props.status);
  }

  public markAsOutForDelivery(
    authorId: UniqueEntityId,
    deliveryPersonId: UniqueEntityId,
    description?: string
  ): Either<InvalidatePackageStatusError, PackageStatus> {
    const outForDeliveryStatus = PackageStatus.create('out_for_delivery');

    if (outForDeliveryStatus.isLeft()) {
      return left(outForDeliveryStatus.value);
    }

    const transitionResult = this.status.transitionTo(
      outForDeliveryStatus.value
    );

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: authorId,
      createdAt: new Date(),
      deliveryPersonId: deliveryPersonId,
      description: description ?? 'Package is out for delivery',
      fromStatus: this.status,
      toStatus: outForDeliveryStatus.value,
    });

    this.props.deliveryPersonId = deliveryPersonId;
    this.props.status = outForDeliveryStatus.value;
    this.touch();

    this.addDomainEvent(
      new PackageIsOutForDeliveryEvent(packageHistory, this.id)
    );

    this.histories.add(packageHistory);

    return right(this.props.status);
  }

  public markAsDelivered(
    deliveryPersonId: UniqueEntityId,
    attachmentId: UniqueEntityId,
    description?: string
  ): Either<InvalidatePackageStatusError, PackageStatus> {
    const deliveredStatus = PackageStatus.create('delivered');

    if (deliveredStatus.isLeft()) {
      return left(deliveredStatus.value);
    }

    const transitionResult = this.status.transitionTo(deliveredStatus.value);

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    const packageAttachment = PackageAttachment.create({
      attachmentId: attachmentId,
      PackageId: this.props.id,
    });

    const packageHistory = PackageHistory.create({
      packageId: this.props.id,
      authorId: deliveryPersonId,
      createdAt: new Date(),
      deliveryPersonId: deliveryPersonId,
      description: description ?? 'Package was delivered',
      fromStatus: this.status,
      toStatus: deliveredStatus.value,
    });

    this.props.attachment = packageAttachment;
    this.props.status = deliveredStatus.value;
    this.props.deliveredAt = new Date();
    this.touch();

    this.addDomainEvent(new PackageWasDeliveredEvent(packageHistory, this.id));

    this.histories.add(packageHistory);

    return right(this.props.status);
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
