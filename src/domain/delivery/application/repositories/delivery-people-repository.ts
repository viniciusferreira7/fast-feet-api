import type { Pagination } from '@/core/entities/value-object/pagination';
import type { PaginationParams } from '@/core/repositories/pagination-params';
import { DeliveryPerson } from '../../enterprise/entities/delivery-person';

export interface FindManyDeliveryPersonParams extends PaginationParams {
  search?: string;
  isPublic?: boolean;
  createdAtGte?: Date;
  updatedAtGte?: Date;
  order?:
    | 'created_at'
    | 'updated_at'
    | 'title'
    | 'description'
    | 'destinationUrl'
    | '-created_at'
    | '-updated_at'
    | '-title'
    | '-description'
    | '-destinationUrl';
}

export abstract class DeliveryPeopleRepository {
  abstract register(data: DeliveryPerson): Promise<DeliveryPerson>;
  abstract findByCpf(cpf: string): Promise<DeliveryPerson | null>;
  abstract findByEmail(email: string): Promise<DeliveryPerson | null>;
  abstract findById(email: string): Promise<DeliveryPerson | null>;
  abstract findManyDeliveryPerson(
    params: FindManyDeliveryPersonParams
  ): Promise<Pagination<DeliveryPerson>>;
  abstract update(data: DeliveryPerson): Promise<null>;
}
