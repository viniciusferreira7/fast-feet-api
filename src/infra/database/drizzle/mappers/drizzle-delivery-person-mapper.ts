import type { InferSelectModel } from 'drizzle-orm';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { DeliveryPerson } from '@/domain/delivery/enterprise/entities/delivery-person';
import { EmailVerification } from '@/domain/delivery/enterprise/entities/email-verification';
import { Cpf } from '@/domain/delivery/enterprise/entities/value-object/cpf';
import { VerificationCode } from '@/domain/delivery/enterprise/entities/value-object/verification-code';
import type { deliveryProfiles, emailsCodes, users } from '../schema';

type UserRaw = InferSelectModel<typeof users>;
type EmailCodeRaw = InferSelectModel<typeof emailsCodes>;
type DeliveryProfileRaw = InferSelectModel<typeof deliveryProfiles>;

/**
 * Shape returned by Drizzle when joining users LEFT JOIN email_codes.
 * The property keys match the SQL table names defined in pgTable().
 */
export type DeliveryPersonRaw = {
  users: UserRaw;
  email_codes: EmailCodeRaw | null;
};

export class DrizzleDeliveryPersonMapper {
  /**
   * Maps the DeliveryPerson aggregate to the rows that must be persisted.
   * Returns two separate pieces because they go into two different tables:
   *   - `user`      → INSERT/UPDATE users
   *   - `emailCode` → INSERT/UPDATE email_codes (upsert before users, due to FK)
   */
  public static toPersistence(
    deliveryPerson: DeliveryPerson,
    userVersion: number,
    profileVersion: number
  ): {
    user: UserRaw;
    emailCode: EmailCodeRaw | null;
    deliveryProfile: DeliveryProfileRaw;
  } {
    const emailVerification = deliveryPerson.emailVerification;

    const emailCode: EmailCodeRaw | null = emailVerification
      ? {
          id: emailVerification.id.toString(),
          code: emailVerification.code,
          createdAt: emailVerification.createdAt,
          validatedAt: emailVerification.validatedAt ?? null,
        }
      : null;

    const user: UserRaw = {
      id: deliveryPerson.id.toString(),
      name: deliveryPerson.name,
      cpf: deliveryPerson.cpf.value,
      email: deliveryPerson.email,
      role: 'RECIPIENT',
      password: deliveryPerson.password,
      createdAt: deliveryPerson.createdAt,
      updatedAt: deliveryPerson.updatedAt,
      version: userVersion,
      emailCode: emailVerification?.id.toString() ?? null,
    };

    const deliveryProfile: DeliveryProfileRaw = {
      userId: user.id.toString(),
      version: profileVersion,
      isActive: true,
    };

    return { user, emailCode, deliveryProfile };
  }

  /**
   * Reconstructs the DeliveryPerson aggregate from a joined Drizzle row.
   * Call this with the result of:
   *   db.select().from(users).leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
   */
  public static toDomain(raw: DeliveryPersonRaw): DeliveryPerson {
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

    return DeliveryPerson.create(
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
