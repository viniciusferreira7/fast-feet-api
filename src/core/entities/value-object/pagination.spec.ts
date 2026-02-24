import { Pagination } from './pagination';

describe('Pagination', () => {
  it('should be able to create a pagination', () => {
    const pagination = Pagination.create({
      page: 1,
      totalPages: 5,
      perPage: 10,
      result: [],
    });

    expect(pagination).toBeInstanceOf(Pagination);
  });

  it('should be able to return page', () => {
    const pagination = Pagination.create({
      page: 2,
      totalPages: 5,
      perPage: 10,
      result: [],
    });

    expect(pagination.page).toBe(2);
  });

  it('should be able to return totalPages', () => {
    const pagination = Pagination.create({
      page: 1,
      totalPages: 8,
      perPage: 10,
      result: [],
    });

    expect(pagination.totalPages).toBe(8);
  });

  it('should be able to return perPage', () => {
    const pagination = Pagination.create({
      page: 1,
      totalPages: 5,
      perPage: 20,
      result: [],
    });

    expect(pagination.perPage).toBe(20);
  });

  it('should be able to return result items', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];

    const pagination = Pagination.create({
      page: 1,
      totalPages: 1,
      perPage: 10,
      result: items,
    });

    expect(pagination.result).toHaveLength(3);
    expect(pagination.result).toEqual(items);
  });

  it('should be able to create pagination with empty result', () => {
    const pagination = Pagination.create({
      page: 1,
      totalPages: 0,
      perPage: 10,
      result: [],
    });

    expect(pagination.result).toHaveLength(0);
  });

  it('should be able to compare two equal paginations', () => {
    const items = [{ id: 1 }];

    const pagination1 = Pagination.create({
      page: 1,
      totalPages: 1,
      perPage: 10,
      result: items,
    });

    const pagination2 = Pagination.create({
      page: 1,
      totalPages: 1,
      perPage: 10,
      result: items,
    });

    expect(pagination1.equals(pagination2)).toBe(true);
  });

  it('should be able to compare two different paginations', () => {
    const pagination1 = Pagination.create({
      page: 1,
      totalPages: 3,
      perPage: 10,
      result: [],
    });

    const pagination2 = Pagination.create({
      page: 2,
      totalPages: 3,
      perPage: 10,
      result: [],
    });

    expect(pagination1.equals(pagination2)).toBe(false);
  });

  it('should be able to work with typed generic result', () => {
    interface User {
      id: string;
      name: string;
    }

    const users: User[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];

    const pagination = Pagination.create<User>({
      page: 1,
      totalPages: 1,
      perPage: 10,
      result: users,
    });

    expect(pagination.result[0].name).toBe('Alice');
    expect(pagination.result[1].name).toBe('Bob');
  });
});
