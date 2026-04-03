import { makeAdminPerson } from 'test/factories/make-admin-person';
import { makeDeliveryPerson } from 'test/factories/make-delivery-person';
import { makePackage } from 'test/factories/make-package';
import { InMemoryAdminPeopleRepository } from 'test/repositories/in-memory-admin-people-repository';
import { InMemoryDeliveryPeopleRepository } from 'test/repositories/in-memory-delivery-people-repository';
import { InMemoryPackagesHistoryRepository } from 'test/repositories/in-memory-packages-history-repository';
import { InMemoryPackagesRepository } from 'test/repositories/in-memory-packages-repository';
import { FakePostalCodeValidator } from 'test/validation/fake-postal-code-validator';
import { left } from '@/core/either';
import { Pagination } from '@/core/entities/value-object/pagination';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { PostalCode } from '../../enterprise/entities/value-object/postal-code';
import { ExternalPostalCodeError } from '../../errors/external-postal-code-validation-error';
import { InvalidPostalCode } from '../../errors/invalid-postal-code-error';
import { FetchPackagesNearByDeliveryPersonUseCase } from './fetch-packages-near-by-delivery-person';

let packagesRepository: InMemoryPackagesRepository;
let packageHistoryRepository: InMemoryPackagesHistoryRepository;
let adminPeopleRepository: InMemoryAdminPeopleRepository;
let deliveryPeopleRepository: InMemoryDeliveryPeopleRepository;
let postalCodeValidator: FakePostalCodeValidator;
let sut: FetchPackagesNearByDeliveryPersonUseCase;

describe('Fetch Packages Near By Delivery Person', () => {
  beforeEach(() => {
    packageHistoryRepository = new InMemoryPackagesHistoryRepository();
    packagesRepository = new InMemoryPackagesRepository(
      packageHistoryRepository
    );
    adminPeopleRepository = new InMemoryAdminPeopleRepository();
    deliveryPeopleRepository = new InMemoryDeliveryPeopleRepository();
    postalCodeValidator = new FakePostalCodeValidator();
    sut = new FetchPackagesNearByDeliveryPersonUseCase(
      packagesRepository,
      adminPeopleRepository,
      deliveryPeopleRepository,
      postalCodeValidator
    );
  });

  it('should be able to fetch packages near by delivery person', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();
    const pkg1 = makePackage();
    const pkg2 = makePackage();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(pkg1);
    await packagesRepository.register(pkg2);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      deliveryPersonPostalCodeLocation: '12345-678',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages).toBeInstanceOf(Pagination);
      expect(result.value.packages.result).toHaveLength(2);
    }
  });

  it('should return only packages matching postal code prefix', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    const nearByPkg = makePackage();

    const farPostalCodeResult = PostalCode.create({ value: '99999-000' });
    if (farPostalCodeResult.isLeft()) throw new Error('Invalid postal code');
    const farPkg = makePackage({ postalCode: farPostalCodeResult.value });

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);
    await packagesRepository.register(nearByPkg);
    await packagesRepository.register(farPkg);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      deliveryPersonPostalCodeLocation: '12345-678',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(1);
      expect(result.value.packages.result[0].id.equals(nearByPkg.id)).toBe(
        true
      );
    }
  });

  it('should respect pagination params', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    for (let i = 0; i < 3; i++) {
      await packagesRepository.register(makePackage());
    }

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      deliveryPersonPostalCodeLocation: '12345-678',
      page: 1,
      perPage: 2,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.packages.result).toHaveLength(2);
      expect(result.value.packages.page).toBe(1);
      expect(result.value.packages.perPage).toBe(2);
    }
  });

  it('should not be able to fetch packages with non-existent admin', async () => {
    const deliveryPerson = makeDeliveryPerson();
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      authorId: 'non-existent-admin-id',
      deliveryPersonId: deliveryPerson.id.toString(),
      deliveryPersonPostalCodeLocation: '12345-678',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to fetch packages with non-existent delivery person', async () => {
    const admin = makeAdminPerson();
    await adminPeopleRepository.register(admin);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: 'non-existent-delivery-person-id',
      deliveryPersonPostalCodeLocation: '12345-678',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('should not be able to fetch packages when external postal code validation fails', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    vi.spyOn(postalCodeValidator, 'validate').mockResolvedValue(
      left(new ExternalPostalCodeError())
    );

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      deliveryPersonPostalCodeLocation: '12345-678',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ExternalPostalCodeError);
    }
  });

  it('should not be able to fetch packages with invalid postal code format', async () => {
    const admin = makeAdminPerson();
    const deliveryPerson = makeDeliveryPerson();

    await adminPeopleRepository.register(admin);
    await deliveryPeopleRepository.register(deliveryPerson);

    const result = await sut.execute({
      authorId: admin.id.toString(),
      deliveryPersonId: deliveryPerson.id.toString(),
      deliveryPersonPostalCodeLocation: 'invalid-postal-code',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidPostalCode);
    }
  });
});
