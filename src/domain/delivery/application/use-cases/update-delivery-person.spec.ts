import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { DeliveryPersonProfileIsDisableError } from './errors/delivery-person-profile-is-disable-error';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';
import { UpdateDeliveryPersonUseCase } from './update-delivery-person';

let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let sut: UpdateDeliveryPersonUseCase;

describe('Update Delivery Person', () => {
  beforeEach(() => {
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    sut = new UpdateDeliveryPersonUseCase(
      deliveryPeopleRepository,
      adminPeopleRepository,
      recipientPeopleRepository
    );
  });

  it('should be able to update delivery person name', async () => {
    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      id: deliveryPerson.id.toString(),
      name: 'Updated Name',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.name).toBe('Updated Name');
    }
  });

  it('should be able to update delivery person email', async () => {
    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      id: deliveryPerson.id.toString(),
      email: 'updated@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.email).toBe('updated@example.com');
    }
  });

  it('should be able to update both name and email', async () => {
    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      id: deliveryPerson.id.toString(),
      name: 'New Name',
      email: 'new@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.deliveryPerson.name).toBe('New Name');
      expect(result.value.deliveryPerson.email).toBe('new@example.com');
    }
  });

  it('should persist changes to the repository', async () => {
    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    await sut.execute({
      id: deliveryPerson.id.toString(),
      name: 'Persisted Name',
      email: 'persisted@example.com',
    });

    expect(deliveryPeopleRepository.deliveryPeople[0].name).toBe(
      'Persisted Name'
    );
    expect(deliveryPeopleRepository.deliveryPeople[0].email).toBe(
      'persisted@example.com'
    );
  });

  it('should return DeliveryPersonProfileIsDisableError if profile is disabled', async () => {
    const deliveryPerson = makeDeliveryPerson({ isActive: false });
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      id: deliveryPerson.id.toString(),
      name: 'New Name',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(DeliveryPersonProfileIsDisableError);
    }
  });

  it('should return ResourceNotFoundError if delivery person does not exist', async () => {
    const result = await sut.execute({
      id: 'non-existent-id',
      name: 'John Doe',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should return EmailAlreadyInUseError if email is already used by another delivery person', async () => {
    const existing = makeDeliveryPerson({ email: 'taken@example.com' });
    await deliveryPeopleRepository.register(existing);

    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      id: deliveryPerson.id.toString(),
      email: 'taken@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailAlreadyInUseError);
    }
  });

  it('should return EmailAlreadyInUseError if email is already used by an admin person', async () => {
    const admin = makeAdminPerson({ email: 'admin@example.com' });
    await adminPeopleRepository.register(admin);

    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      id: deliveryPerson.id.toString(),
      email: 'admin@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailAlreadyInUseError);
    }
  });

  it('should return EmailAlreadyInUseError if email is already used by a recipient person', async () => {
    const recipient = makeRecipientPerson({ email: 'recipient@example.com' });
    await recipientPeopleRepository.register(recipient);

    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      id: deliveryPerson.id.toString(),
      email: 'recipient@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailAlreadyInUseError);
    }
  });

  it('should not check email conflicts when no email is provided', async () => {
    const existing = makeDeliveryPerson({ email: 'taken@example.com' });
    await deliveryPeopleRepository.register(existing);

    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      id: deliveryPerson.id.toString(),
      name: 'Only Name Update',
    });

    expect(result.isRight()).toBe(true);
  });
});
