import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { RecipientPerson } from '../../enterprise/entities/recipient-person';
import { OnlyAdminCanPerformThisActionError } from './errors/only-admin-can-perform-this-action-error';
import { GetByIdRecipientPersonUseCase } from './get-by-id-recipient-person';

let adminPeopleRepository: InMemoryAdminPeopleRepository;
let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let sut: GetByIdRecipientPersonUseCase;

describe('Get By Id Recipient Person', () => {
  beforeEach(() => {
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    sut = new GetByIdRecipientPersonUseCase(
      recipientPeopleRepository,
      adminPeopleRepository
    );
  });

  it('should be able to get recipient person info as an admin', async () => {
    const admin = makeAdminPerson();
    const recipientPerson = makeRecipientPerson();

    await adminPeopleRepository.register(admin);
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      recipientPersonId: recipientPerson.id.toString(),
      authorId: admin.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson).toBeInstanceOf(RecipientPerson);
      expect(result.value.recipientPerson.id.equals(recipientPerson.id)).toBe(
        true
      );
    }
  });

  it('should be able to get own recipient person info', async () => {
    const recipientPerson = makeRecipientPerson();

    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      recipientPersonId: recipientPerson.id.toString(),
      authorId: recipientPerson.id.toString(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson).toBeInstanceOf(RecipientPerson);
      expect(result.value.recipientPerson.id.equals(recipientPerson.id)).toBe(
        true
      );
    }
  });

  it('should not be able to get recipient person info with non-existent recipient person', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      recipientPersonId: 'non-existent-recipient-person-id',
      authorId: admin.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to get recipient person info with non-admin author', async () => {
    const recipientPerson1 = makeRecipientPerson();
    const recipientPerson2 = makeRecipientPerson();

    await recipientPeopleRepository.register(recipientPerson1);
    await recipientPeopleRepository.register(recipientPerson2);

    const result = await sut.execute({
      recipientPersonId: recipientPerson1.id.toString(),
      authorId: recipientPerson2.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });

  it('should not be able to get recipient person info with non-existent author', async () => {
    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      recipientPersonId: recipientPerson.id.toString(),
      authorId: 'non-existent-author-id',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(OnlyAdminCanPerformThisActionError);
    }
  });
});
