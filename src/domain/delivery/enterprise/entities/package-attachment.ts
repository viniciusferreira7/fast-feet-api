import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';

export interface PackageAttachmentProps {
  PackageId: UniqueEntityId;
  attachmentId: UniqueEntityId;
}

export class PackageAttachment extends Entity<PackageAttachmentProps> {
  get PackageId() {
    return this.props.PackageId;
  }

  get attachmentId() {
    return this.props.attachmentId;
  }

  static create(props: PackageAttachmentProps, id?: UniqueEntityId) {
    const attachment = new PackageAttachment(props, id);

    return attachment;
  }
}
