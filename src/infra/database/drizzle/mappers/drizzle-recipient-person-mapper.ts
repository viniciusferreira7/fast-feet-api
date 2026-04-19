import type { InferSelectModel } from 'drizzle-orm';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { EmailVerification } from '@/domain/delivery/enterprise/entities/email-verification';
import { RecipientPerson } from '@/domain/delivery/enterprise/entities/recipient-person';
import { Cpf } from '@/domain/delivery/enterprise/entities/value-object/cpf';
import { VerificationCode } from '@/domain/delivery/enterprise/entities/value-object/verification-code';
import type { emailsCodes, recipientProfiles, users } from '../schema';

type UserRaw = InferSelectModel<typeof users>;
type EmailCodeRaw = InferSelectModel<typeof emailsCodes>;
type RecipientProfileRaw = InferSelectModel<typeof recipientProfiles>;

export type RecipientPersonRaw = {
  users: UserRaw;
  email_codes: EmailCodeRaw | null;
};

export class DrizzleRecipientPersonMapper {
  public static toPersistence(
    recipientPerson: RecipientPerson,
    userVersion: number,
    profileVersion: number
  ): {
    user: UserRaw;
    emailCode: EmailCodeRaw | null;
    recipientProfile: RecipientProfileRaw;
  } {
    const emailVerification = recipientPerson.emailVerification;

    const emailCode: EmailCodeRaw | null = emailVerification
      ? {
          id: emailVerification.id.toString(),
          code: emailVerification.code,
          createdAt: emailVerification.createdAt,
          validatedAt: emailVerification.validatedAt ?? null,
        }
      : null;

    const user: UserRaw = {
      id: recipientPerson.id.toString(),
      name: recipientPerson.name,
      cpf: recipientPerson.cpf.value,
      email: recipientPerson.email,
      role: 'RECIPIENT',
      password: recipientPerson.password,
      createdAt: recipientPerson.createdAt,
      updatedAt: recipientPerson.updatedAt,
      version: userVersion,
      emailCode: emailVerification?.id.toString() ?? null,
    };

    const recipientProfile: RecipientProfileRaw = {
      userId: user.id,
      version: profileVersion,
    };

    return { user, emailCode, recipientProfile };
  }

  public static toDomain(raw: RecipientPersonRaw): RecipientPerson {
    const cpf = Cpf.create(raw.users.cpf);

    if (cpf.isLeft()) {
      throw new Error(`Corrupted CPF in database for user ${raw.users.id}`);
    }

    let emailVerification: EmailVerification | null = null;

    if (raw.email_codes) {
      const verificationCode = VerificationCode.create(raw.email_codes.code);

      if (verificationCode.isRight()) {
        emailVerification = EmailVerification.restore(
          {
            verificationCode: verificationCode.value,
            createdAt: raw.email_codes.createdAt,
            validatedAt: raw.email_codes.validatedAt,
          },
          new UniqueEntityId(raw.email_codes.id)
        );
      }
    }

    return RecipientPerson.create(
      {
        name: raw.users.name,
        cpf: cpf.value,
        email: raw.users.email,
        password: raw.users.password,
        emailVerification,
        createdAt: raw.users.createdAt,
        updatedAt: raw.users.updatedAt,
      },
      new UniqueEntityId(raw.users.id)
    );
  }
}
