import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { AdminPeopleRepository } from '@/domain/delivery/application/repositories/admin-people-repository';
import { AdminPerson } from '@/domain/delivery/enterprise/entities/admin-person';
import { DrizzleService } from '../drizzle.service';
import { DrizzleAdminPersonMapper } from '../mappers/drizzle-admin-person-mapper';
import { emailsCodes, users } from '../schema';

@Injectable()
export class DrizzleAdminPeopleRepository implements AdminPeopleRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  public async register(data: AdminPerson): Promise<AdminPerson> {
    const { user: adminPerson, emailCode } =
      DrizzleAdminPersonMapper.toPersistence(data, 1);

    await this.drizzleService.db.insert(users).values({
      id: adminPerson.id,
      cpf: adminPerson.cpf,
      name: adminPerson.name,
      email: adminPerson.email,
      password: adminPerson.password,
      role: adminPerson.role,
      emailCode: emailCode?.id,
      version: adminPerson.version,
    });

    return DrizzleAdminPersonMapper.toDomain({
      users: adminPerson,
      email_codes: emailCode,
    });
  }

  public async findByCpf(cpf: string): Promise<AdminPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(and(eq(users.cpf, cpf), eq(users.role, 'ADMIN')));

    if (!row) return null;

    return DrizzleAdminPersonMapper.toDomain({
      users: row.users,
      email_codes: row.email_codes,
    });
  }

  public async findByEmail(email: string): Promise<AdminPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(and(eq(users.email, email), eq(users.role, 'ADMIN')));

    if (!row) return null;

    return DrizzleAdminPersonMapper.toDomain({
      users: row.users,
      email_codes: row.email_codes,
    });
  }

  public async findById(id: string): Promise<AdminPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(and(eq(users.id, id), eq(users.role, 'ADMIN')));

    if (!row) return null;

    return DrizzleAdminPersonMapper.toDomain({
      users: row.users,
      email_codes: row.email_codes,
    });
  }
  public async update(data: AdminPerson): Promise<AdminPerson | null> {
    const [adminPersonOnDatabase] = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.id, data.id.toString()));

    if (!adminPersonOnDatabase) return null;

    const { user: adminPerson, emailCode } =
      DrizzleAdminPersonMapper.toPersistence(
        data,
        adminPersonOnDatabase.version + 1
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
        cpf: adminPerson.cpf,
        name: adminPerson.name,
        email: adminPerson.email,
        password: adminPerson.password,
        role: adminPerson.role,
        emailCode: emailCode?.id ?? null,
        emailVerifiedAt: adminPerson.emailVerifiedAt,
        version: adminPerson.version,
      })
      .where(
        and(
          eq(users.id, data.id.toString()),
          eq(users.version, adminPersonOnDatabase.version)
        )
      );

    return DrizzleAdminPersonMapper.toDomain({
      users: adminPerson,
      email_codes: emailCode,
    });
  }
}
