import type { MultipartFile } from '@fastify/multipart';
import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';

interface MultipartRequest extends Record<string, unknown> {
  file(): Promise<MultipartFile | undefined>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class FastifyFileInterceptor implements NestInterceptor {
  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<MultipartRequest>();

    const file = await request.file();

    if (!file) {
      throw new BadRequestException('File is required');
    }

    const buffer = await file.toBuffer();

    if (buffer.byteLength > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Max size is 5MB');
    }

    request['uploadedFile'] = {
      filename: file.filename,
      mimetype: file.mimetype,
      buffer,
    };

    return next.handle();
  }
}
