import { faker } from '@faker-js/faker';
import type {
  Uploader,
  UploadParams,
} from '@/domain/delivery/application/storage/uploader';

interface Upload {
  fileName: string;
  key: string;
}

export class FakeUploader implements Uploader {
  public uploads: Upload[] = [];

  async upload({ fileName }: UploadParams): Promise<{ key: string }> {
    const key = faker.string.uuid();

    this.uploads.push({
      fileName,
      key,
    });

    return { key };
  }
}
