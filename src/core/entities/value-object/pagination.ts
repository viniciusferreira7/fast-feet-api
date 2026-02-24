import { ValueObject } from './value-object';

interface PaginationProps<T> {
  page: number;
  totalPages: number;
  perPage: number;
  result: T[];
}

export class Pagination<Entity> extends ValueObject<PaginationProps<Entity>> {
  get page(): number {
    return this.props.page;
  }

  get totalPages(): number {
    return this.props.totalPages;
  }

  get perPage(): number {
    return this.props.perPage;
  }

  get result(): Entity[] {
    return this.props.result;
  }

  public static create<Entity>(
    props: PaginationProps<Entity>
  ): Pagination<Entity> {
    return new Pagination(props);
  }
}
