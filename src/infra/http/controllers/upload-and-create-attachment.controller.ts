import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { InvalidAttachmentTypeError } from '@/domain/delivery/application/use-cases/errors/invalid-attachment-type-error';
import { UploadAndCreateAttachmentUseCase } from '@/domain/delivery/application/use-cases/upload-and-create-attachment';
import { Role } from '@/infra/auth/decorators/role.decorator';
import { RoleGuard } from '@/infra/auth/guards/role.guard';
import {
  UploadedFile,
  type UploadedFileDto,
} from '../decorators/uploaded-file.decorator';
import { FastifyFileInterceptor } from '../interceptors/fastify-file.interceptor';
import { AttachmentPresenter } from '../presenters/attachment-presenter';

@ApiTags('Attachments')
@ApiBearerAuth('JWT-auth')
@Role('Delivery')
@UseGuards(RoleGuard)
@Controller('upload')
export class UploadAndCreateAttachmentController {
  constructor(
    private readonly uploadAndCreateAttachmentUseCase: UploadAndCreateAttachmentUseCase
  ) {}

  @Post()
  @HttpCode(201)
  @UseInterceptors(FastifyFileInterceptor)
  @ApiOperation({
    summary: 'Upload a file and create an attachment (delivery person only)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Attachment created successfully' })
  @ApiBadRequestResponse({ description: 'Invalid file type or file too large' })
  @ApiForbiddenResponse({
    description: 'Only delivery persons can upload files',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
  async handler(@UploadedFile() file: UploadedFileDto) {
    const result = await this.uploadAndCreateAttachmentUseCase.execute({
      fileName: file.filename,
      fileType: file.mimetype,
      body: file.buffer,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case InvalidAttachmentTypeError:
          throw new BadRequestException(error.message);
        default:
          throw new BadRequestException(error.message);
      }
    }

    return { attachment: AttachmentPresenter.toHttp(result.value.attachment) };
  }
}
