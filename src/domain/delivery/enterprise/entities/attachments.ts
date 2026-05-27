import { Entity } from '@/core/entities/entity';
import type { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';

export interface AttachmentProps {
  title: string;
  key: string;
}

export class Attachment extends Entity<AttachmentProps> {
  get title() {
    return this.props.title;
  }

  get key() {
    return this.props.key;
  }

  static create(props: AttachmentProps, id?: UniqueEntityId) {
    const attachment = new Attachment(props, id);

    return attachment;
  }
}
