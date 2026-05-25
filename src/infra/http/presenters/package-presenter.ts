import type { Package } from '@/domain/delivery/enterprise/entities/package';
import type { Status } from '@/domain/delivery/enterprise/entities/value-object/package-status';

export interface PackagePresenterToHttp {
  id: string;
  name: string;
  code: string;
  recipient_id: string;
  recipient_address: string;
  delivery_person_id: string | null;
  author_id: string;
  status: Status;
  postal_code: string;
  created_at: Date;
  updated_at: Date | null;
  delivered_at: Date | null;
}

export interface PackagePublicPresenterToHttp {
  code: string;
  name: string;
  status: Status;
  recipient_address: string;
  updated_at: Date | null;
  delivered_at: Date | null;
}

export class PackagePresenter {
  public static toHttp(packageData: Package): PackagePresenterToHttp {
    return {
      id: packageData.id.toString(),
      name: packageData.name,
      code: packageData.code.value,
      recipient_id: packageData.recipientId.toString(),
      recipient_address: packageData.recipientAddress,
      delivery_person_id: packageData.deliveryPersonId?.toString() ?? null,
      author_id: packageData.authorId.toString(),
      status: packageData.status.value,
      postal_code: packageData.postalCode.value,
      created_at: packageData.createdAt,
      updated_at: packageData.updatedAt,
      delivered_at: packageData.deliveredAt,
    };
  }

  public static toPublicHttp(packageData: Package): PackagePublicPresenterToHttp {
    return {
      code: packageData.code.value,
      name: packageData.name,
      status: packageData.status.value,
      recipient_address: packageData.recipientAddress,
      updated_at: packageData.updatedAt,
      delivered_at: packageData.deliveredAt,
    };
  }
}
