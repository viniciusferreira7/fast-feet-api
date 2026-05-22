import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { RecipientPeopleRepository } from '@/domain/delivery/application/repositories/recipient-people-repository';
import type { RecipientPerson } from '@/domain/delivery/enterprise/entities/recipient-person';
import { DrizzleService } from '../drizzle.service';
import { DrizzleRecipientPersonMapper } from '../mappers/drizzle-recipient-person-mapper';
import { emailsCodes, recipientProfiles, users } from '../schema';

@Injectable()
export class DrizzleRecipientPeopleRepository
  implements RecipientPeopleRepository
{
  constructor(private readonly drizzleService: DrizzleService) {}

  public async register(data: RecipientPerson): Promise<RecipientPerson> {
    const {
      user: recipientPerson,
      emailCode,
      recipientProfile,
    } = DrizzleRecipientPersonMapper.toPersistence(data, 1, 1);

    await this.drizzleService.db.insert(users).values({
      id: recipientPerson.id,
      cpf: recipientPerson.cpf,
      name: recipientPerson.name,
      email: recipientPerson.email,
      password: recipientPerson.password,
      role: recipientPerson.role,
      emailCode: emailCode?.id,
      version: recipientPerson.version,
    });

    await this.drizzleService.db.insert(recipientProfiles).values({
      userId: recipientProfile.userId,
      version: recipientProfile.version,
    });

    return DrizzleRecipientPersonMapper.toDomain({
      users: recipientPerson,
      email_codes: emailCode,
    });
  }

  public async findByCpf(cpf: string): Promise<RecipientPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .innerJoin(recipientProfiles, eq(recipientProfiles.userId, users.id))
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(eq(users.cpf, cpf));

    if (!row) return null;

    return DrizzleRecipientPersonMapper.toDomain({
      users: row.users,
      email_codes: row.email_codes,
    });
  }

  public async findByEmail(email: string): Promise<RecipientPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .innerJoin(recipientProfiles, eq(recipientProfiles.userId, users.id))
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(eq(users.email, email));

    if (!row) return null;

    return DrizzleRecipientPersonMapper.toDomain({
      users: row.users,
      email_codes: row.email_codes,
    });
  }

  public async findById(id: string): Promise<RecipientPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .innerJoin(recipientProfiles, eq(recipientProfiles.userId, users.id))
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(eq(users.id, id));

    if (!row) return null;

    return DrizzleRecipientPersonMapper.toDomain({
      users: row.users,
      email_codes: row.email_codes,
    });
  }

  public async update(data: RecipientPerson): Promise<RecipientPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .innerJoin(recipientProfiles, eq(recipientProfiles.userId, users.id))
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(eq(users.id, data.id.toString()));

    if (!row) return null;

    const {
      user: recipientPerson,
      emailCode,
      recipientProfile,
    } = DrizzleRecipientPersonMapper.toPersistence(
      data,
      row.users.version + 1,
      row.recipient_profiles.version + 1
    );

    if (emailCode) {
      await this.drizzleService.db
        .insert(emailsCodes)
        .values(emailCode)
        .onConflictDoUpdate({
          target: emailsCodes.id,
          set: { validatedAt: emailCode.validatedAt },
        });
    }

    await this.drizzleService.db
      .update(users)
      .set({
        cpf: recipientPerson.cpf,
        name: recipientPerson.name,
        email: recipientPerson.email,
        password: recipientPerson.password,
        role: recipientPerson.role,
        emailCode: emailCode?.id ?? null,
        emailVerifiedAt: recipientPerson.emailVerifiedAt,
        version: recipientPerson.version,
      })
      .where(
        and(
          eq(users.id, data.id.toString()),
          eq(users.version, row.users.version)
        )
      );

    await this.drizzleService.db
      .update(recipientProfiles)
      .set({ version: recipientProfile.version })
      .where(
        and(
          eq(recipientProfiles.userId, data.id.toString()),
          eq(recipientProfiles.version, row.recipient_profiles.version)
        )
      );

    return DrizzleRecipientPersonMapper.toDomain({
      users: recipientPerson,
      email_codes: emailCode,
    });
  }
}
