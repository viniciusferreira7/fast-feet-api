import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import {
  PackageAttachment,
  type PackageAttachmentProps,
} from '@/domain/delivery/enterprise/entities/package-attachment';

export function makePackageAttachment(
  override: Partial<PackageAttachmentProps> = {},
  id?: UniqueEntityId
) {
  const packageAttachment = PackageAttachment.create(
    {
      PackageId: new UniqueEntityId(),
      attachmentId: new UniqueEntityId(),
      ...override,
    },
    id
  );

  return packageAttachment;
}
