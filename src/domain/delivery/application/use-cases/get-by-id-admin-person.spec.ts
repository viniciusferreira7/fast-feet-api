import { makeAdminPerson } from 'test/factories/make-admin-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { AdminPerson } from '../../enterprise/entities/admin-person';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { GetByIdAdminPersonUseCase } from './get-by-id-admin-person';

let adminPeopleRepository: InMemoryAdminPeopleRepository;
let sut: GetByIdAdminPersonUseCase;

describe('Get By Id Admin Person', () => {
  beforeEach(() => {
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    sut = new GetByIdAdminPersonUseCase(adminPeopleRepository);
  });

  it('should be able to get admin person info as another admin', async () => {
    const author = makeAdminPerson();
    const adminPerson = makeAdminPerson();

    await adminPeopleRepository.register(author);
    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      adminPersonId: adminPerson.id.toString(),
      authorId: author.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson).toBeInstanceOf(AdminPerson);
      expect(result.value.adminPerson.id.equals(adminPerson.id)).toBe(true);
    }
  });

  it('should be able to get own admin person info', async () => {
    const adminPerson = makeAdminPerson();

    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      adminPersonId: adminPerson.id.toString(),
      authorId: adminPerson.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson).toBeInstanceOf(AdminPerson);
      expect(result.value.adminPerson.id.equals(adminPerson.id)).toBe(true);
    }
  });

  it('should not be able to get admin person info with non-existent admin person', async () => {
    const author = makeAdminPerson();
    await adminPeopleRepository.register(author);

    const result = await sut.execute({
      adminPersonId: 'non-existent-admin-person-id',
      authorId: author.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to get admin person info with non-existent author', async () => {
    const adminPerson = makeAdminPerson();
    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      adminPersonId: adminPerson.id.toString(),
      authorId: 'non-existent-author-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });
});
