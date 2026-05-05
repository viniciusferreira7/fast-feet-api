import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import z from 'zod';
import { AuthenticateAdminPersonUseCase } from '@/domain/delivery/application/use-cases/authenticate-admin-person';
import { EmailCodeHasNotBeenVerifiedError } from '@/domain/delivery/application/use-cases/errors/email-code-has-not-been-verified-error';
import { WrongCredentialsError } from '@/domain/delivery/application/use-cases/errors/wrong-credentials-error';
import { Public } from '@/infra/auth/decorators/public.decorator';
import { cpfSchema } from '@/infra/utils/zod-schemas/cpf-schema';
import { passwordSchema } from '@/infra/utils/zod-schemas/password-schema';
import { ZodValidationPipe } from '../pipes/zod-validation-pipes';

const authenticateAdminSchema = z.object({
  cpf: cpfSchema,
  password: passwordSchema,
});

type AuthenticateAdminSchema = z.infer<typeof authenticateAdminSchema>;

@ApiTags('Admins')
@Controller('admins/login')
export class AuthenticateAdminPersonController {
  constructor(
    private readonly authenticateAdminPersonUseCase: AuthenticateAdminPersonUseCase
  ) {}

  @Post()
  @Public()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(authenticateAdminSchema))
  @ApiOperation({ summary: 'Authenticate an admin person' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['cpf', 'password'],
      properties: {
        cpf: { type: 'string', example: '123.456.789-09' },
        password: {
          type: 'string',
          format: 'password',
          description:
            'Min 8 chars, must include uppercase, lowercase, number, and special character',
          example: 'Str0ng!Pass',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Admin authenticated successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Wrong credentials or email not verified',
  })
  async handler(@Body() body: AuthenticateAdminSchema) {
    const result = await this.authenticateAdminPersonUseCase.execute({
      cpf: body.cpf,
      password: body.password,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new BadRequestException(error.message);
        case EmailCodeHasNotBeenVerifiedError:
          throw new BadRequestException(error.message);

        default:
          throw new BadRequestException(error.message);
      }
    }

    return { access_token: result.value.accessToken };
  }
}
