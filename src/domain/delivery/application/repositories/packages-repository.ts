import type { Pagination } from '@/core/entities/value-object/pagination';
import type { PaginationParams } from '@/core/repositories/pagination-params';
import type { Package } from '../../enterprise/entities/package';
import type { PostalCode } from '../../enterprise/entities/value-object/postal-code';

export interface FindNearByParams {
  postalCode: PostalCode;
  page?: number;
  perPage?: number;
}

export interface FindManyPackagesParams extends PaginationParams {
  search?: string;
  name?: string;
  code?: string;
  recipientAddress?: string;
  status?: string;
  deliveredAtGte?: Date;
  postalCode?: string;
  createdAtGte?: Date;
  updatedAtGte?: Date;
  order?:
    | 'created_at'
    | 'updated_at'
    | 'name'
    | 'code'
    | 'recipient_address'
    | 'status'
    | 'postal_code'
    | '-created_at'
    | '-updated_at'
    | '-name'
    | '-code'
    | '-recipient_address'
    | '-status'
    | '-postal_code';
}

export abstract class PackagesRepository {
  abstract register(data: Package): Promise<Package>;
  abstract findById(id: string): Promise<Package | null>;
  abstract findByCode(code: string): Promise<Package | null>;
  abstract update(data: Package): Promise<Package | null>;
  abstract findNearBy(params: FindNearByParams): Promise<Pagination<Package>>;
  abstract findManyPackages(
    params: FindManyPackagesParams
  ): Promise<Pagination<Package>>;
}
