import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { ValueObject } from '@/core/entities/value-object/value-object';
import type { Attachment } from '../attachments';
import type { PackageHistory } from '../package-history';
import type { PackageCode } from './package-code';
import type { PackageStatus } from './package-status';
import type { PostalCode } from './postal-code';

export interface PackageDetailsRecipient {
  id: UniqueEntityId;
  name: string;
  email: string;
}

export interface PackageDetailsAuthor {
  id: UniqueEntityId;
  name: string;
}

export interface PackageDetailsDeliveryPerson {
  id: UniqueEntityId;
  name: string;
}

export interface PackageDetailsProps {
  packageId: UniqueEntityId;
  name: string;
  code: PackageCode;
  status: PackageStatus;
  recipient: PackageDetailsRecipient;
  recipientAddress: string;
  postalCode: PostalCode;
  author: PackageDetailsAuthor;
  deliveryPerson: PackageDetailsDeliveryPerson | null;
  attachment: Attachment | null;
  histories: PackageHistory[];
  createdAt: Date;
  updatedAt: Date | null;
  deliveredAt: Date | null;
}

export class PackageDetails extends ValueObject<PackageDetailsProps> {
  get packageId() {
    return this.props.packageId;
  }

  get name() {
    return this.props.name;
  }

  get code() {
    return this.props.code;
  }

  get status() {
    return this.props.status;
  }

  get recipient() {
    return this.props.recipient;
  }

  get recipientAddress() {
    return this.props.recipientAddress;
  }

  get postalCode() {
    return this.props.postalCode;
  }

  get author() {
    return this.props.author;
  }

  get deliveryPerson() {
    return this.props.deliveryPerson;
  }

  get attachment() {
    return this.props.attachment;
  }

  get histories() {
    return this.props.histories;
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

  public static create(props: PackageDetailsProps): PackageDetails {
    return new PackageDetails(props);
  }
}
