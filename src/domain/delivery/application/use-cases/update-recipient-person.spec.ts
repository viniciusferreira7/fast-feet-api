import { FakeEmailSender } from 'test/email/fake-email-sender';
import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makeRecipientPerson } from 'test/factories/make-recipient-person';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryRecipientPeopleRepository } from 'test/repositories/in-memory-recipient-people-repository';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { EmailAlreadyInUseError } from './errors/email-already-in-use-error';
import { UpdateRecipientPersonUseCase } from './update-recipient-person';

let recipientPeopleRepository: InMemoryRecipientPeopleRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let emailSender: FakeEmailSender;
let sut: UpdateRecipientPersonUseCase;

describe('Update Recipient Person', () => {
  beforeEach(() => {
    recipientPeopleRepository = new InMemoryRecipientPeopleRepository();
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    emailSender = new FakeEmailSender();
    sut = new UpdateRecipientPersonUseCase(
      recipientPeopleRepository,
      adminPeopleRepository,
      deliveryPeopleRepository,
      emailSender
    );
  });

  it('should be able to update recipient person name', async () => {
    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      id: recipientPerson.id.toString(),
      name: 'Updated Name',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson.name).toBe('Updated Name');
    }
  });

  it('should be able to update recipient person email', async () => {
    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      id: recipientPerson.id.toString(),
      email: 'updated@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson.email).toBe('updated@example.com');
    }
  });

  it('should be able to update both name and email', async () => {
    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      id: recipientPerson.id.toString(),
      name: 'New Name',
      email: 'new@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson.name).toBe('New Name');
      expect(result.value.recipientPerson.email).toBe('new@example.com');
    }
  });

  it('should persist changes to the repository', async () => {
    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    await sut.execute({
      id: recipientPerson.id.toString(),
      name: 'Persisted Name',
      email: 'persisted@example.com',
    });

    expect(recipientPeopleRepository.recipientPeople[0].name).toBe(
      'Persisted Name'
    );
    expect(recipientPeopleRepository.recipientPeople[0].email).toBe(
      'persisted@example.com'
    );
  });

  it('should return ResourceNotFoundError if recipient person does not exist', async () => {
    const result = await sut.execute({
      id: 'non-existent-id',
      name: 'John Doe',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should return EmailAlreadyInUseError if email is already used by another recipient person', async () => {
    const existing = makeRecipientPerson({ email: 'taken@example.com' });
    await recipientPeopleRepository.register(existing);

    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      id: recipientPerson.id.toString(),
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

    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      id: recipientPerson.id.toString(),
      email: 'admin@example.com',
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

    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      id: recipientPerson.id.toString(),
      email: 'delivery@example.com',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(EmailAlreadyInUseError);
    }
  });

  it('should not check email conflicts when no email is provided', async () => {
    const existing = makeRecipientPerson({ email: 'taken@example.com' });
    await recipientPeopleRepository.register(existing);

    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      id: recipientPerson.id.toString(),
      name: 'Only Name Update',
    });

    expect(result.isRight()).toBe(true);
  });

  it('should clear emailVerifiedAt when email is updated', async () => {
    const recipientPerson = makeRecipientPerson({
      emailVerifiedAt: new Date(),
    });
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      id: recipientPerson.id.toString(),
      email: 'new@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson.emailVerifiedAt).toBeNull();
    }
  });

  it('should create a new email verification when email is updated', async () => {
    const recipientPerson = makeRecipientPerson({ emailVerification: null });
    await recipientPeopleRepository.register(recipientPerson);

    const result = await sut.execute({
      id: recipientPerson.id.toString(),
      email: 'new@example.com',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.recipientPerson.emailVerification).toBeTruthy();
      expect(result.value.recipientPerson.emailVerification?.code).toBeTruthy();
    }
  });

  it('should send a verification code to the new email when email is updated', async () => {
    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    await sut.execute({
      id: recipientPerson.id.toString(),
      email: 'new@example.com',
    });

    expect(emailSender.sentEmails).toHaveLength(1);
    expect(emailSender.sentEmails[0]).toEqual({
      title: 'Fast Feet sent a code confirmation',
      content: expect.stringContaining('Your new code is'),
      to: 'new@example.com',
    });
  });

  it('should not send a verification code when only name is updated', async () => {
    const recipientPerson = makeRecipientPerson();
    await recipientPeopleRepository.register(recipientPerson);

    await sut.execute({
      id: recipientPerson.id.toString(),
      name: 'New Name',
    });

    expect(emailSender.sentEmails).toHaveLength(0);
  });
});
