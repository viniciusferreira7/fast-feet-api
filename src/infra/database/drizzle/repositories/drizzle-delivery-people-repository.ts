import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  or,
  type SQL,
} from 'drizzle-orm';
import { Pagination } from '@/core/entities/value-object/pagination';
import {
  DeliveryPeopleRepository,
  type FindManyDeliveryPersonParams,
} from '@/domain/delivery/application/repositories/delivery-people-repository';
import type { DeliveryPerson } from '@/domain/delivery/enterprise/entities/delivery-person';
import { DrizzleService } from '../drizzle.service';
import { DrizzleDeliveryPersonMapper } from '../mappers/drizzle-delivery-person-mapper';
import { deliveryProfiles, emailsCodes, users } from '../schema';

@Injectable()
export class DrizzleDeliveryPeopleRepository
  implements DeliveryPeopleRepository
{
  constructor(private readonly drizzleService: DrizzleService) {}

  public async register(data: DeliveryPerson): Promise<DeliveryPerson> {
    const {
      user: deliveryPerson,
      emailCode,
      deliveryProfile,
    } = DrizzleDeliveryPersonMapper.toPersistence(data, 1, 1);

    await this.drizzleService.db.insert(users).values({
      id: deliveryPerson.id,
      cpf: deliveryPerson.cpf,
      name: deliveryPerson.name,
      email: deliveryPerson.email,
      password: deliveryPerson.password,
      role: deliveryPerson.role,
      emailCode: emailCode?.id,
      version: deliveryPerson.version,
    });

    await this.drizzleService.db.insert(deliveryProfiles).values({
      userId: deliveryProfile.userId,
      isActive: deliveryProfile.isActive,
      version: deliveryProfile.version,
    });

    return DrizzleDeliveryPersonMapper.toDomain({
      users: deliveryPerson,
      email_codes: emailCode,
      delivery_profiles: deliveryProfile,
    });
  }

  public async findByCpf(cpf: string): Promise<DeliveryPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .innerJoin(deliveryProfiles, eq(deliveryProfiles.userId, users.id))
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(eq(users.cpf, cpf));

    if (!row) return null;

    return DrizzleDeliveryPersonMapper.toDomain({
      users: row.users,
      email_codes: row.email_codes,
      delivery_profiles: row.delivery_profiles,
    });
  }

  public async findByEmail(email: string): Promise<DeliveryPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .innerJoin(deliveryProfiles, eq(deliveryProfiles.userId, users.id))
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(eq(users.email, email));

    if (!row) return null;

    return DrizzleDeliveryPersonMapper.toDomain({
      users: row.users,
      email_codes: row.email_codes,
      delivery_profiles: row.delivery_profiles,
    });
  }

  public async findById(id: string): Promise<DeliveryPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .innerJoin(deliveryProfiles, eq(deliveryProfiles.userId, users.id))
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(eq(users.id, id));

    if (!row) return null;

    return DrizzleDeliveryPersonMapper.toDomain({
      users: row.users,
      email_codes: row.email_codes,
      delivery_profiles: row.delivery_profiles,
    });
  }

  public async findManyDeliveryPerson(
    params: FindManyDeliveryPersonParams
  ): Promise<Pagination<DeliveryPerson>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;
    const offset = (page - 1) * perPage;

    const conditions: SQL<unknown>[] = [];

    if (params.email) conditions.push(eq(users.email, params.email));
    if (params.name) conditions.push(ilike(users.name, `%${params.name}%`));
    if (params.cpf) conditions.push(eq(users.cpf, params.cpf));
    if (params.isActive !== undefined)
      conditions.push(eq(deliveryProfiles.isActive, params.isActive));
    if (params.createdAtGte)
      conditions.push(gte(users.createdAt, params.createdAtGte));
    if (params.updatedAtGte)
      conditions.push(gte(users.updatedAt, params.updatedAtGte));
    if (params.search) {
      const searchClause = or(
        ilike(users.name, `%${params.search}%`),
        ilike(users.email, `%${params.search}%`),
        ilike(users.cpf, `%${params.search}%`)
      );
      if (searchClause) conditions.push(searchClause);
    }

    const orderMap = {
      name: asc(users.name),
      '-name': desc(users.name),
      cpf: asc(users.cpf),
      '-cpf': desc(users.cpf),
      email: asc(users.email),
      '-email': desc(users.email),
      created_at: asc(users.createdAt),
      '-created_at': desc(users.createdAt),
      updated_at: asc(users.updatedAt),
      '-updated_at': desc(users.updatedAt),
      is_active: asc(deliveryProfiles.isActive),
      '-is_active': desc(deliveryProfiles.isActive),
    };

    const orderBy = params.order
      ? orderMap[params.order]
      : asc(users.createdAt);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(users)
      .innerJoin(deliveryProfiles, eq(deliveryProfiles.userId, users.id))
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(whereClause);

    const rows = await this.drizzleService.db
      .select()
      .from(users)
      .innerJoin(deliveryProfiles, eq(deliveryProfiles.userId, users.id))
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(perPage)
      .offset(offset);

    const result = rows.map((row) =>
      DrizzleDeliveryPersonMapper.toDomain({
        users: row.users,
        email_codes: row.email_codes,
        delivery_profiles: row.delivery_profiles,
      })
    );

    return Pagination.create({
      page,
      perPage,
      totalPages: Math.ceil(Number(total) / perPage),
      result,
    });
  }

  public async update(data: DeliveryPerson): Promise<DeliveryPerson | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .innerJoin(deliveryProfiles, eq(deliveryProfiles.userId, users.id))
      .leftJoin(emailsCodes, eq(users.emailCode, emailsCodes.id))
      .where(eq(users.id, data.id.toString()));

    if (!row) return null;

    const {
      user: deliveryPerson,
      emailCode,
      deliveryProfile,
    } = DrizzleDeliveryPersonMapper.toPersistence(
      data,
      row.users.version + 1,
      row.delivery_profiles.version + 1
    );

    await this.drizzleService.db
      .update(users)
      .set({
        cpf: deliveryPerson.cpf,
        name: deliveryPerson.name,
        email: deliveryPerson.email,
        password: deliveryPerson.password,
        role: deliveryPerson.role,
        emailCode: emailCode?.id ?? null,
        emailVerifiedAt: deliveryPerson.emailVerifiedAt,
        version: deliveryPerson.version,
      })
      .where(
        and(
          eq(users.id, data.id.toString()),
          eq(users.version, row.users.version)
        )
      );

    await this.drizzleService.db
      .update(deliveryProfiles)
      .set({
        isActive: deliveryProfile.isActive,
        version: deliveryProfile.version,
      })
      .where(
        and(
          eq(deliveryProfiles.userId, data.id.toString()),
          eq(deliveryProfiles.version, row.delivery_profiles.version)
        )
      );

    return DrizzleDeliveryPersonMapper.toDomain({
      users: deliveryPerson,
      email_codes: emailCode,
      delivery_profiles: deliveryProfile,
    });
  }
}
