import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { of } from 'rxjs';
import { FastifyFileInterceptor } from './fastify-file.interceptor';

function makeContext(requestProps: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => requestProps,
    }),
  } as unknown as ExecutionContext;
}

const nextHandler: CallHandler = { handle: () => of(null) };

describe('FastifyFileInterceptor', () => {
  let interceptor: FastifyFileInterceptor;

  beforeEach(() => {
    interceptor = new FastifyFileInterceptor();
  });

  it('should throw BadRequestException when no file is present', async () => {
    const ctx = makeContext({ file: async () => undefined });

    await expect(interceptor.intercept(ctx, nextHandler)).rejects.toThrow(
      new BadRequestException('File is required')
    );
  });

  it('should throw BadRequestException when file exceeds 5 MB', async () => {
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1);
    const ctx = makeContext({
      file: async () => ({
        filename: 'big.jpg',
        mimetype: 'image/jpeg',
        toBuffer: async () => bigBuffer,
      }),
    });

    await expect(interceptor.intercept(ctx, nextHandler)).rejects.toThrow(
      new BadRequestException('File too large. Max size is 5MB')
    );
  });

  it('should attach parsed file to request and call next when file is valid', async () => {
    const buffer = Buffer.from('fake-image-data');
    const request: Record<string, unknown> = {
      file: async () => ({
        filename: 'photo.jpg',
        mimetype: 'image/jpeg',
        toBuffer: async () => buffer,
      }),
    };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await interceptor.intercept(ctx, nextHandler);

    expect(request['uploadedFile']).toEqual({
      filename: 'photo.jpg',
      mimetype: 'image/jpeg',
      buffer,
    });
  });
});
