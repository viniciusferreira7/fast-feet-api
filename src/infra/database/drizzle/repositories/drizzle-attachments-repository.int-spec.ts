import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { makeAttachment } from 'test/factories/make-attachment';
import { makeModuleRef } from 'test/factories/make-module-ref';
import { AttachmentsRepository } from '@/domain/delivery/application/repositories/attachments-repository';
import { DrizzleAttachmentsRepository } from './drizzle-attachments-repository';

let app: INestApplication;
let repository: DrizzleAttachmentsRepository;

describe('DrizzleAttachmentsRepository', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = moduleRef.createNestApplication();
    repository = moduleRef.get(AttachmentsRepository);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('create', () => {
    it('should persist an attachment without error', async () => {
      const attachment = makeAttachment();

      await expect(repository.create(attachment)).resolves.not.toThrow();
    });
  });

  describe('findById', () => {
    it('should return null when attachment does not exist', async () => {
      const result = await repository.findById(randomUUID());

      expect(result).toBeNull();
    });

    it('should return attachment by id', async () => {
      const attachment = makeAttachment();
      await repository.create(attachment);

      const result = await repository.findById(attachment.id.toString());

      expect(result).not.toBeNull();
      expect(result?.id.toString()).toEqual(attachment.id.toString());
      expect(result?.url).toEqual(attachment.url);
    });
  });
});
