import type { PackageDetails } from '@/domain/delivery/enterprise/entities/value-object/package-details';
import type { Status } from '@/domain/delivery/enterprise/entities/value-object/package-status';
import {
  AttachmentPresenter,
  type AttachmentPresenterToHttp,
} from './attachment-presenter';
import {
  PackageHistoryPresenter,
  type PackageHistoryPresenterToHttp,
} from './package-history-presenter';

interface PackageDetailsRecipientToHttp {
  id: string;
  name: string;
  email: string;
}

interface PackageDetailsAuthorToHttp {
  id: string;
  name: string;
}

interface PackageDetailsDeliveryPersonToHttp {
  id: string;
  name: string;
}

interface PackageDetailsPresenterToHttp {
  id: string;
  name: string;
  code: string;
  status: Status;
  recipient: PackageDetailsRecipientToHttp;
  recipient_address: string;
  postal_code: string;
  author: PackageDetailsAuthorToHttp;
  delivery_person: PackageDetailsDeliveryPersonToHttp | null;
  attachment: AttachmentPresenterToHttp | null;
  histories: PackageHistoryPresenterToHttp[];
  created_at: Date;
  updated_at: Date | null;
  delivered_at: Date | null;
}

export class PackageDetailsPresenter {
  public static toHttp(details: PackageDetails): PackageDetailsPresenterToHttp {
    return {
      id: details.packageId.toString(),
      name: details.name,
      code: details.code.value,
      status: details.status.value,
      recipient: {
        id: details.recipient.id.toString(),
        name: details.recipient.name,
        email: details.recipient.email,
      },
      recipient_address: details.recipientAddress,
      postal_code: details.postalCode.value,
      author: {
        id: details.author.id.toString(),
        name: details.author.name,
      },
      delivery_person: details.deliveryPerson
        ? {
            id: details.deliveryPerson.id.toString(),
            name: details.deliveryPerson.name,
          }
        : null,
      attachment: details.attachment
        ? AttachmentPresenter.toHttp(details.attachment)
        : null,
      histories: details.histories.map(PackageHistoryPresenter.toHttp),
      created_at: details.createdAt,
      updated_at: details.updatedAt,
      delivered_at: details.deliveredAt,
    };
  }
}
