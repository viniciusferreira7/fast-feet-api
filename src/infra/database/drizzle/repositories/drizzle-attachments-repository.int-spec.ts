import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { makeAttachment } from 'test/factories/make-attachment';
import { makeModuleRef, startApp } from 'test/factories/make-module-ref';
import { AttachmentsRepository } from '@/domain/delivery/application/repositories/attachments-repository';
import { DrizzleAttachmentsRepository } from './drizzle-attachments-repository';

let app: INestApplication;
let repository: DrizzleAttachmentsRepository;

describe('DrizzleAttachmentsRepository', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    app = await startApp(moduleRef);
    repository = moduleRef.get(AttachmentsRepository);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('create', () => {
    it('should persist an attachment without error', async () => {
      const attachment = makeAttachment();

      await expect(repository.create(attachment)).resolves.not.toThrow();
    });

    it('should persist the title correctly', async () => {
      const attachment = makeAttachment({ title: 'delivery-proof.jpg' });
      await repository.create(attachment);

      const found = await repository.findById(attachment.id.toString());

      expect(found?.title).toEqual('delivery-proof.jpg');
    });

    it('should persist the url correctly', async () => {
      const url = 'https://bucket.s3.amazonaws.com/receipt.jpg';
      const attachment = makeAttachment({ url });
      await repository.create(attachment);

      const found = await repository.findById(attachment.id.toString());

      expect(found?.url).toEqual(url);
    });

    it('should allow multiple distinct attachments to coexist', async () => {
      const a1 = makeAttachment();
      const a2 = makeAttachment();

      await repository.create(a1);
      await repository.create(a2);

      const found1 = await repository.findById(a1.id.toString());
      const found2 = await repository.findById(a2.id.toString());

      expect(found1?.id.toString()).toEqual(a1.id.toString());
      expect(found2?.id.toString()).toEqual(a2.id.toString());
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

    it('should return the correct attachment when multiple exist', async () => {
      const a1 = makeAttachment({ title: 'file-one.jpg' });
      const a2 = makeAttachment({ title: 'file-two.jpg' });

      await repository.create(a1);
      await repository.create(a2);

      const found = await repository.findById(a2.id.toString());

      expect(found?.title).toEqual('file-two.jpg');
      expect(found?.id.toString()).toEqual(a2.id.toString());
    });

    it('should return null for a non-existent UUID even when other attachments exist', async () => {
      const attachment = makeAttachment();
      await repository.create(attachment);

      const result = await repository.findById(randomUUID());

      expect(result).toBeNull();
    });

    it('should still find the original attachment after other attachments are created', async () => {
      const original = makeAttachment({
        url: 'https://s3.example.com/original.jpg',
      });
      await repository.create(original);
      await repository.create(makeAttachment());
      await repository.create(makeAttachment());

      const found = await repository.findById(original.id.toString());

      expect(found?.url).toEqual('https://s3.example.com/original.jpg');
    });
  });
});
