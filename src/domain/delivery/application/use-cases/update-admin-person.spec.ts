import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';
import { UpdateAdminPersonUseCase } from './update-admin-person';

let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let sut: UpdateAdminPersonUseCase;

describe('Update Admin Person', () => {
  beforeEach(() => {
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    sut = new UpdateAdminPersonUseCase(
      adminPeopleRepository,
      deliveryPeopleRepository,
      recipientPeopleRepository
    );
  });

  it('should be able to update admin person name', async () => {
    const adminPerson = makeAdminPerson();
    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      id: adminPerson.id.toString(),
      name: 'Updated Name',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.name).toBe('Updated Name');
    }
  });

  it('should be able to update admin person email', async () => {
    const adminPerson = makeAdminPerson();
    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      id: adminPerson.id.toString(),
      email: 'updated@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.email).toBe('updated@example.com');
    }
  });

  it('should be able to update both name and email', async () => {
    const adminPerson = makeAdminPerson();
    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      id: adminPerson.id.toString(),
      name: 'New Name',
      email: 'new@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.adminPerson.name).toBe('New Name');
      expect(result.value.adminPerson.email).toBe('new@example.com');
    }
  });

  it('should persist changes to the repository', async () => {
    const adminPerson = makeAdminPerson();
    await adminPeopleRepository.register(adminPerson);

    await sut.execute({
      id: adminPerson.id.toString(),
      name: 'Persisted Name',
      email: 'persisted@example.com',
    });

    expect(adminPeopleRepository.adminPeople[0].name).toBe('Persisted Name');
    expect(adminPeopleRepository.adminPeople[0].email).toBe(
      'persisted@example.com'
    );
  });

  it('should return ResourceNotFoundError if admin person does not exist', async () => {
    const result = await sut.execute({
      id: 'non-existent-id',
      name: 'John Doe',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should return EmailAlreadyInUseError if email is already used by another admin person', async () => {
    const existing = makeAdminPerson({ email: 'taken@example.com' });
    await adminPeopleRepository.register(existing);

    const adminPerson = makeAdminPerson();
    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      id: adminPerson.id.toString(),
      email: 'taken@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailAlreadyInUseError);
    }
  });

  it('should return EmailAlreadyInUseError if email is already used by a delivery person', async () => {
    const deliveryPerson = makeDeliveryPerson({
      email: 'delivery@example.com',
    });
    await deliveryPeopleRepository.register(deliveryPerson);

    const adminPerson = makeAdminPerson();
    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      id: adminPerson.id.toString(),
      email: 'delivery@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailAlreadyInUseError);
    }
  });

  it('should return EmailAlreadyInUseError if email is already used by a recipient person', async () => {
    const recipient = makeRecipientPerson({ email: 'recipient@example.com' });
    await recipientPeopleRepository.register(recipient);

    const adminPerson = makeAdminPerson();
    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      id: adminPerson.id.toString(),
      email: 'recipient@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailAlreadyInUseError);
    }
  });

  it('should not check email conflicts when no email is provided', async () => {
    const existing = makeAdminPerson({ email: 'taken@example.com' });
    await adminPeopleRepository.register(existing);

    const adminPerson = makeAdminPerson();
    await adminPeopleRepository.register(adminPerson);

    const result = await sut.execute({
      id: adminPerson.id.toString(),
      name: 'Only Name Update',
    });

    expect(result.isRight()).toBe(true);
  });
});
