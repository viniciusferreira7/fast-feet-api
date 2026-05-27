import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface UploadedFileDto {
  filename: string;
  mimetype: string;
  buffer: Buffer;
}

export const UploadedFile = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UploadedFileDto => {
    const request = ctx.switchToHttp().getRequest();
    return request['uploadedFile'] as UploadedFileDto;
  }
);
