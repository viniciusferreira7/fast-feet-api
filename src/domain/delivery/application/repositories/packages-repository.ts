import type { Pagination } from '@/core/entities/value-object/pagination';
import type { Package } from '../../enterprise/entities/package';
import type { PostalCode } from '../../enterprise/entities/value-object/postal-code';

export interface FIndNearByProps {
  postalCode: PostalCode;
  page?: number;
  perPage?: number;
}

export abstract class PackagesRepository {
  abstract register(data: Package): Promise<Package>;
  abstract findById(id: string): Promise<Package | null>;
  abstract update(data: Package): Promise<Package | null>;
  abstract findNearBy(props: FIndNearByProps): Promise<Pagination<Package>>;
}
