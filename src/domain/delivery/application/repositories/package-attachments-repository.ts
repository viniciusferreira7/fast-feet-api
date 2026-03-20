import type { PackageAttachment } from '../../enterprise/entities/package-attachment';

export abstract class PackageAttachmentsRepository {
  abstract create(
    packageAttachment: PackageAttachment
  ): Promise<PackageAttachment>;
  abstract findById(
    packageAttachmentId: string
  ): Promise<PackageAttachment | null>;
  abstract delete(
    packageAttachmentId: string
  ): Promise<PackageAttachment | null>;
}
