import { Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  like,
  type SQL,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { Pagination } from '@/core/entities/value-object/pagination';
import {
  type FindManyPackagesParams,
  type FindNearByParams,
  PackagesRepository,
} from '@/domain/delivery/application/repositories/packages-repository';
import type { Package } from '@/domain/delivery/enterprise/entities/package';
import type { PackageDetails } from '@/domain/delivery/enterprise/entities/value-object/package-details';
import { type Status } from '@/domain/delivery/enterprise/entities/value-object/package-status';
import { DrizzleService } from '../drizzle.service';
import { DrizzlePackageMapper } from '../mappers/drizzle-package-mapper';
import { attachments, packageHistories, packages, users } from '../schema';

@Injectable()
export class DrizzlePackagesRepository implements PackagesRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  private async hydratePackage(
    packageRow: typeof packages.$inferSelect
  ): Promise<Package> {
    const histories = await this.drizzleService.db
      .select()
      .from(packageHistories)
      .where(eq(packageHistories.packageId, packageRow.id))
      .orderBy(asc(packageHistories.createdAt));

    return DrizzlePackageMapper.toDomain({ package: packageRow, histories });
  }

  public async register(data: Package): Promise<Package> {
    const { packageRow, newHistories } = DrizzlePackageMapper.toPersistence(
      data,
      1
    );

    await this.drizzleService.db.insert(packages).values(packageRow);

    if (newHistories.length > 0) {
      await this.drizzleService.db
        .insert(packageHistories)
        .values(newHistories);
    }

    return DrizzlePackageMapper.toDomain({
      package: packageRow,
      histories: newHistories,
    });
  }

  public async findById(id: string): Promise<Package | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(packages)
      .where(eq(packages.id, id));

    if (!row) return null;

    return this.hydratePackage(row);
  }

  public async findByCode(code: string): Promise<Package | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(packages)
      .where(eq(packages.code, code));

    if (!row) return null;

    return this.hydratePackage(row);
  }

  public async findDetailsById(id: string): Promise<PackageDetails | null> {
    return this.hydrateDetails(eq(packages.id, id));
  }

  public async findDetailsByCode(code: string): Promise<PackageDetails | null> {
    return this.hydrateDetails(eq(packages.code, code));
  }

  private async hydrateDetails(
    condition: SQL<unknown>
  ): Promise<PackageDetails | null> {
    const recipient = alias(users, 'recipient');
    const author = alias(users, 'author');
    const deliveryPerson = alias(users, 'delivery_person');

    const [row] = await this.drizzleService.db
      .select({
        package: packages,
        recipient,
        author,
        deliveryPerson,
        attachment: attachments,
      })
      .from(packages)
      .innerJoin(recipient, eq(packages.recipientId, recipient.id))
      .innerJoin(author, eq(packages.authorId, author.id))
      .leftJoin(
        deliveryPerson,
        eq(packages.deliveryPersonId, deliveryPerson.id)
      )
      .leftJoin(attachments, eq(packages.attachmentId, attachments.id))
      .where(condition);

    if (!row) return null;

    const histories = await this.drizzleService.db
      .select()
      .from(packageHistories)
      .where(eq(packageHistories.packageId, row.package.id))
      .orderBy(asc(packageHistories.createdAt));

    return DrizzlePackageMapper.toDetailsDomain({
      package: row.package,
      recipient: row.recipient,
      author: row.author,
      deliveryPerson: row.deliveryPerson,
      attachment: row.attachment,
      histories,
    });
  }

  public async update(data: Package): Promise<Package | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(packages)
      .where(eq(packages.id, data.id.toString()));

    if (!row) return null;

    const { packageRow, newHistories } = DrizzlePackageMapper.toPersistence(
      data,
      row.version + 1
    );

    await this.drizzleService.db
      .update(packages)
      .set({
        name: packageRow.name,
        status: packageRow.status,
        postalCode: packageRow.postalCode,
        recipientAddress: packageRow.recipientAddress,
        attachmentId: packageRow.attachmentId,
        deliveryPersonId: packageRow.deliveryPersonId,
        deliveredAt: packageRow.deliveredAt,
        version: packageRow.version,
      })
      .where(
        and(
          eq(packages.id, data.id.toString()),
          eq(packages.version, row.version)
        )
      );

    if (newHistories.length > 0) {
      await this.drizzleService.db
        .insert(packageHistories)
        .values(newHistories);
    }

    const allHistories = await this.drizzleService.db
      .select()
      .from(packageHistories)
      .where(eq(packageHistories.packageId, packageRow.id))
      .orderBy(asc(packageHistories.createdAt));

    return DrizzlePackageMapper.toDomain({
      package: packageRow,
      histories: allHistories,
    });
  }

  public async findNearBy(
    params: FindNearByParams
  ): Promise<Pagination<Package>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;
    const offset = (page - 1) * perPage;
    const prefix = params.postalCode.value.substring(0, 5);

    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(packages)
      .where(like(packages.postalCode, `${prefix}%`));

    const rows = await this.drizzleService.db
      .select()
      .from(packages)
      .where(like(packages.postalCode, `${prefix}%`))
      .orderBy(asc(packages.createdAt))
      .limit(perPage)
      .offset(offset);

    const result = await Promise.all(rows.map((r) => this.hydratePackage(r)));

    return Pagination.create({
      page,
      perPage,
      totalPages: Math.ceil(Number(total) / perPage),
      result,
    });
  }

  public async findManyPackages(
    params: FindManyPackagesParams
  ): Promise<Pagination<Package>> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;
    const offset = (page - 1) * perPage;

    const conditions: SQL<unknown>[] = [];

    if (params.name) conditions.push(ilike(packages.name, `%${params.name}%`));
    if (params.code) conditions.push(eq(packages.code, params.code));
    if (params.status)
      conditions.push(eq(packages.status, params.status as Status));
    if (params.postalCode)
      conditions.push(eq(packages.postalCode, params.postalCode));
    if (params.recipientAddress)
      conditions.push(
        ilike(packages.recipientAddress, `%${params.recipientAddress}%`)
      );
    if (params.createdAtGte)
      conditions.push(gte(packages.createdAt, params.createdAtGte));
    if (params.updatedAtGte)
      conditions.push(gte(packages.updatedAt, params.updatedAtGte));
    if (params.deliveredAtGte)
      conditions.push(gte(packages.deliveredAt, params.deliveredAtGte));
    if (params.search) {
      conditions.push(ilike(packages.name, `%${params.search}%`));
    }

    const orderMap: Record<string, SQL<unknown>> = {
      name: asc(packages.name),
      '-name': desc(packages.name),
      code: asc(packages.code),
      '-code': desc(packages.code),
      recipient_address: asc(packages.recipientAddress),
      '-recipient_address': desc(packages.recipientAddress),
      status: asc(packages.status),
      '-status': desc(packages.status),
      postal_code: asc(packages.postalCode),
      '-postal_code': desc(packages.postalCode),
      created_at: asc(packages.createdAt),
      '-created_at': desc(packages.createdAt),
      updated_at: asc(packages.updatedAt),
      '-updated_at': desc(packages.updatedAt),
    };

    const orderBy = params.order
      ? orderMap[params.order]
      : asc(packages.createdAt);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await this.drizzleService.db
      .select({ total: count() })
      .from(packages)
      .where(whereClause);

    const rows = await this.drizzleService.db
      .select()
      .from(packages)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(perPage)
      .offset(offset);

    const result = await Promise.all(rows.map((r) => this.hydratePackage(r)));

    return Pagination.create({
      page,
      perPage,
      totalPages: Math.ceil(Number(total) / perPage),
      result,
    });
  }

  public async findByDeliveryPersonId(
    deliveryPersonId: string,
    status: Status[]
  ): Promise<Package[]> {
    const rows = await this.drizzleService.db
      .select()
      .from(packages)
      .where(
        and(
          eq(packages.deliveryPersonId, deliveryPersonId),
          inArray(packages.status, status)
        )
      );

    return Promise.all(rows.map((r) => this.hydratePackage(r)));
  }
}
