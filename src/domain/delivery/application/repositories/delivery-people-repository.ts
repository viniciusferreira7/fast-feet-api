import type { Pagination } from '@/core/entities/value-object/pagination';
import type { PaginationParams } from '@/core/repositories/pagination-params';
import { DeliveryPerson } from '../../enterprise/entities/delivery-person';

export interface FindManyDeliveryPersonParams extends PaginationParams {
  search?: string;
  createdAtGte?: Date;
  email?: string;
  name?: string;
  cpf?: string;
  isActive?: boolean;
  updatedAtGte?: Date;
  order?:
    | 'created_at'
    | 'updated_at'
    | 'name'
    | '-name'
    | 'cpf'
    | '-cpf'
    | 'email'
    | '-email'
    | 'is_active'
    | '-is_active'
    | '-created_at'
    | '-updated_at';
}

export abstract class DeliveryPeopleRepository {
  abstract register(data: DeliveryPerson): Promise<DeliveryPerson>;
  abstract findByCpf(cpf: string): Promise<DeliveryPerson | null>;
  abstract findByEmail(email: string): Promise<DeliveryPerson | null>;
  abstract findById(id: string): Promise<DeliveryPerson | null>;
  abstract findManyDeliveryPerson(
    params: FindManyDeliveryPersonParams
  ): Promise<Pagination<DeliveryPerson>>;
  abstract update(data: DeliveryPerson): Promise<DeliveryPerson | null>;
}
