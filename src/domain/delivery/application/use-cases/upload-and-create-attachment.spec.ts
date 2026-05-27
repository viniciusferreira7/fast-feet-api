import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository';
import { FakeUploader } from 'test/storage/fake-uploader';

import { Attachment } from '../../enterprise/entities/attachments';
import { InvalidAttachmentTypeError } from './errors/invalid-attachment-type-error';
import { UploadAndCreateAttachmentUseCase } from './upload-and-create-attachment';

let attachmentsRepository: InMemoryAttachmentsRepository;
let uploader: FakeUploader;
let sut: UploadAndCreateAttachmentUseCase;

describe('Upload and Create Attachment', () => {
  beforeEach(() => {
    attachmentsRepository = new InMemoryAttachmentsRepository();
    uploader = new FakeUploader();
    sut = new UploadAndCreateAttachmentUseCase(attachmentsRepository, uploader);
  });

  it('should be able to upload and create an attachment with jpeg', async () => {
    const result = await sut.execute({
      fileName: 'photo.jpg',
      fileType: 'image/jpeg',
      body: Buffer.from('fake-image-content'),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.attachment).toBeInstanceOf(Attachment);
      expect(result.value.attachment.title).toBe('photo.jpg');
      expect(result.value.attachment.key).toBeTruthy();
    }
  });

  it('should be able to upload and create an attachment with png', async () => {
    const result = await sut.execute({
      fileName: 'photo.png',
      fileType: 'image/png',
      body: Buffer.from('fake-image-content'),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.attachment).toBeInstanceOf(Attachment);
    }
  });

  it('should persist the attachment in the repository', async () => {
    await sut.execute({
      fileName: 'photo.jpg',
      fileType: 'image/jpeg',
      body: Buffer.from('fake-image-content'),
    });

    expect(attachmentsRepository.attachments).toHaveLength(1);
    expect(attachmentsRepository.attachments[0].title).toBe('photo.jpg');
  });

  it('should upload the file to storage', async () => {
    await sut.execute({
      fileName: 'photo.jpg',
      fileType: 'image/jpeg',
      body: Buffer.from('fake-image-content'),
    });

    expect(uploader.uploads).toHaveLength(1);
    expect(uploader.uploads[0].fileName).toBe('photo.jpg');
  });

  it('should store the key returned by the uploader in the attachment', async () => {
    const result = await sut.execute({
      fileName: 'photo.jpg',
      fileType: 'image/jpeg',
      body: Buffer.from('fake-image-content'),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.attachment.key).toBe(uploader.uploads[0].key);
    }
  });

  it('should not be able to upload a file with an invalid type', async () => {
    const result = await sut.execute({
      fileName: 'document.pdf',
      fileType: 'application/pdf',
      body: Buffer.from('fake-pdf-content'),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAttachmentTypeError);
    }
  });

  it('should not upload to storage when file type is invalid', async () => {
    await sut.execute({
      fileName: 'document.pdf',
      fileType: 'application/pdf',
      body: Buffer.from('fake-pdf-content'),
    });

    expect(uploader.uploads).toHaveLength(0);
    expect(attachmentsRepository.attachments).toHaveLength(0);
  });

  it('should not be able to upload a gif', async () => {
    const result = await sut.execute({
      fileName: 'animation.gif',
      fileType: 'image/gif',
      body: Buffer.from('fake-gif-content'),
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidAttachmentTypeError);
    }
  });
});
