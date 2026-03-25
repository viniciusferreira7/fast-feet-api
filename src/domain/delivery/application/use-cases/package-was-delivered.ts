//TODO: Create use case to delivery package
//TODO: It needs use case to add attachment and assign image with a package

import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import type { Package } from '../../enterprise/entities/package';
import type { AttachmentsRepository } from '../repositories/attachments-repository';
import type { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import type { PackageAttachmentsRepository } from '../repositories/package-attachments-repository';
import type { PackagesRepository } from '../repositories/packages-repository';
import { DeliveryWithoutRequiredPhoto } from './errors/delivery-without-required-photo';

interface PackageWasDeliveredUseCaseRequest {
  packageId: string;
  deliveryPersonId: string;
  attachmentId: string;
  description?: string;
}

type PackageWasDeliveredUseCaseResponse = Either<
  ResourceNotFoundError | DeliveryWithoutRequiredPhoto,
  { package: Package }
>;

export class PackageWasDeliveredUseCase {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly packageAttachmentsRepository: PackageAttachmentsRepository,
    private readonly deliveryPeopleRepository: DeliveryPeopleRepository
  ) {}

  async execute({
    packageId,
    deliveryPersonId,
    attachmentId,
    description,
  }: PackageWasDeliveredUseCaseRequest): Promise<PackageWasDeliveredUseCaseResponse> {
    const [packageRecord, attachment, deliveryPersonRecord] = await Promise.all(
      [
        this.packagesRepository.findById(packageId),
        this.attachmentsRepository.findById(attachmentId),
        this.deliveryPeopleRepository.findById(deliveryPersonId),
      ]
    );

    if (!packageRecord) {
      return left(new ResourceNotFoundError('package'));
    }

    if (!attachment) {
      return left(new DeliveryWithoutRequiredPhoto());
    }

    if (!deliveryPersonRecord) {
      return left(new ResourceNotFoundError('delivery person'));
    }

    const transitionResult = packageRecord.markAsDelivered(
      deliveryPersonRecord.id,
      attachment.id,
      description
    );

    if (transitionResult.isLeft()) {
      return left(transitionResult.value);
    }

    if (!packageRecord?.attachment) {
      return left(new DeliveryWithoutRequiredPhoto());
    }

    await this.packageAttachmentsRepository.create(packageRecord.attachment);
    await this.packagesRepository.update(packageRecord);

    return right({ package: packageRecord });
  }
}
