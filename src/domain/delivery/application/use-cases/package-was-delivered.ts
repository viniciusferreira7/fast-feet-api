import { Injectable } from '@nestjs/common';
import { type Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '../../../../core/errors/resource-not-found-error';
import { Package } from '../../enterprise/entities/package';
import { AttachmentsRepository } from '../repositories/attachments-repository';
import { DeliveryPeopleRepository } from '../repositories/delivery-people-repository';
import { PackageAttachmentsRepository } from '../repositories/package-attachments-repository';
import { PackagesRepository } from '../repositories/packages-repository';
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

@Injectable()
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
