import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { makeModuleRef } from 'test/factories/make-module-ref';
import { Uploader } from '@/domain/delivery/application/storage/uploader';

let uploader: Uploader;

describe('R2Storage', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    uploader = moduleRef.get<Uploader>(Uploader);
  });

  it('should be defined', () => {
    expect(uploader).toBeDefined();
  });

  it('should upload a file and return a url key', async () => {
    const filePath = resolve(
      __dirname,
      '../../../test/utils/assets/file-to-use-on-upload.png'
    );
    const body = readFileSync(filePath);

    const result = await uploader.upload({
      fileName: 'file-to-use-on-upload.png',
      fileType: 'image/png',
      body,
    });

    expect(result.url).toEqual(expect.any(String));
    expect(result.url.length).toBeGreaterThan(0);
    expect(result.url).toContain('file-to-use-on-upload.png');
  });

  it('should generate a unique key for each upload of the same file', async () => {
    const filePath = resolve(
      __dirname,
      '../../../test/utils/assets/file-to-use-on-upload.png'
    );
    const body = readFileSync(filePath);
    const params = {
      fileName: 'file-to-use-on-upload.png',
      fileType: 'image/png',
      body,
    };

    const [first, second] = await Promise.all([
      uploader.upload(params),
      uploader.upload(params),
    ]);

    expect(first.url).not.toEqual(second.url);
  });
});
