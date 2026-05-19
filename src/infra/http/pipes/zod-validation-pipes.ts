import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { ZodError, type ZodType } from 'zod';
import { fromZodError } from 'zod-validation-error';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);

      return parsedValue;
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        console.log({ error }, 'Error here');
        throw new BadRequestException({
          errors: fromZodError(error),
          message: 'Validation failed',
          statusCode: 400,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}

//TODO: All e2e tests are falling and returning 400
