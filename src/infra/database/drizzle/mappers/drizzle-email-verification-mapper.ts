import type { InferSelectModel } from 'drizzle-orm';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { EmailVerification } from '@/domain/delivery/enterprise/entities/email-verification';
import { VerificationCode } from '@/domain/delivery/enterprise/entities/value-object/verification-code';
import type { emailsCodes } from '../schema';

type EmailCodeRaw = InferSelectModel<typeof emailsCodes>;

export class DrizzleEmailVerificationMapper {
  public static toPersistence(
    emailVerification: EmailVerification
  ): EmailCodeRaw {
    return {
      id: emailVerification.id.toString(),
      code: emailVerification.code,
      createdAt: emailVerification.createdAt,
      validatedAt: emailVerification.validatedAt ?? null,
    };
  }

  public static toDomain(raw: EmailCodeRaw): EmailVerification {
    const verificationCode = VerificationCode.create(raw.code);

    if (verificationCode.isLeft()) {
      throw new Error(
        `Corrupted verification code in database for email code ${raw.id}`
      );
    }

    return EmailVerification.restore(
      {
        verificationCode: verificationCode.value,
        createdAt: raw.createdAt,
        validatedAt: raw.validatedAt,
      },
      new UniqueEntityId(raw.id)
    );
  }
}
