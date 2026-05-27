import type { Attachment } from '@/domain/delivery/enterprise/entities/attachments';

export interface AttachmentPresenterToHttp {
  id: string;
  title: string;
  url: string;
}

export class AttachmentPresenter {
  static toHttp(
    attachment: Attachment,
    baseUrl: string
  ): AttachmentPresenterToHttp {
    return {
      id: attachment.id.toString(),
      title: attachment.title,
      url: `${baseUrl}/${attachment.key}`,
    };
  }
}
