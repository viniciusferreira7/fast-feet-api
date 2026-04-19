import type { InferSelectModel } from 'drizzle-orm';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { AdminPerson } from '@/domain/delivery/enterprise/entities/admin-person';
import { EmailVerification } from '@/domain/delivery/enterprise/entities/email-verification';
import { Cpf } from '@/domain/delivery/enterprise/entities/value-object/cpf';
import { VerificationCode } from '@/domain/delivery/enterprise/entities/value-object/verification-code';
import type { emailsCodes, users } from '../schema';

type UserRaw = InferSelectModel<typeof users>;
type EmailCodeRaw = InferSelectModel<typeof emailsCodes>;

/**
 * Shape returned by Drizzle when joining users LEFT JOIN email_codes.
 * The property keys match the SQL table names defined in pgTable().
 */
export type AdminPersonRaw = {
  users: UserRaw;
  email_codes: EmailCodeRaw | null;
};

export class DrizzleAdminPersonMapper {
  public static toPersistence(
    adminPerson: AdminPerson,
    version: number
  ): { user: UserRaw; emailCode: EmailCodeRaw | null } {
    const emailVerification = adminPerson.emailVerification;

    const emailCode: EmailCodeRaw | null = emailVerification
      ? {
          id: emailVerification.id.toString(),
          code: emailVerification.code,
          createdAt: emailVerification.createdAt,
          validatedAt: emailVerification.validatedAt ?? null,
        }
      : null;

    const user: UserRaw = {
      id: adminPerson.id.toString(),
      name: adminPerson.name,
      cpf: adminPerson.cpf.value,
      email: adminPerson.email,
      role: 'ADMIN',
      password: adminPerson.password,
      createdAt: adminPerson.createdAt,
      updatedAt: adminPerson.updatedAt,
      version,
      emailCode: emailVerification?.id.toString() ?? null,
    };

    return { user, emailCode };
  }

  public static toDomain(raw: AdminPersonRaw): AdminPerson {
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

    return AdminPerson.create(
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
