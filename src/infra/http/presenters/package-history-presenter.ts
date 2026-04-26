import type { PackageHistory } from '@/domain/delivery/enterprise/entities/package-history';
import type { Status } from '@/domain/delivery/enterprise/entities/value-object/package-status';

export interface PackageHistoryPresenterToHttp {
  id: string;
  package_id: string;
  from_status: Status | null;
  to_status: Status;
  author_id: string;
  delivery_personId: string | null;
  description: string | null;
  created_at: Date;
}

export class PackageHistoryPresenter {
  public static toHttp(
    packageHistory: PackageHistory
  ): PackageHistoryPresenterToHttp {
    return {
      id: packageHistory.id.toString(),
      package_id: packageHistory.packageId.toString(),
      from_status: packageHistory.fromStatus?.value ?? null,
      to_status: packageHistory.toStatus.value,
      author_id: packageHistory.authorId.toString(),
      delivery_personId: packageHistory.deliveryPersonId?.toString() ?? null,
      description: packageHistory.description,
      created_at: packageHistory.createdAt,
    };
  }
}
