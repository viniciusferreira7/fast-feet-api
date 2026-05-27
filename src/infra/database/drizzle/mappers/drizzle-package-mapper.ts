import type { InferSelectModel } from 'drizzle-orm';
import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { Attachment } from '@/domain/delivery/enterprise/entities/attachments';
import { Package } from '@/domain/delivery/enterprise/entities/package';
import { PackageAttachment } from '@/domain/delivery/enterprise/entities/package-attachment';
import { PackageHistory } from '@/domain/delivery/enterprise/entities/package-history';
import { PackageCode } from '@/domain/delivery/enterprise/entities/value-object/package-code';
import { PackageDetails } from '@/domain/delivery/enterprise/entities/value-object/package-details';
import { PackageHistoryList } from '@/domain/delivery/enterprise/entities/value-object/package-history-list';
import { PackageStatus } from '@/domain/delivery/enterprise/entities/value-object/package-status';
import { PostalCode } from '@/domain/delivery/enterprise/entities/value-object/postal-code';
import type { attachments, packageHistories, packages, users } from '../schema';

type PackageRaw = InferSelectModel<typeof packages>;
type PackageHistoryRaw = InferSelectModel<typeof packageHistories>;
type UserRaw = InferSelectModel<typeof users>;
type AttachmentRaw = InferSelectModel<typeof attachments>;

export type PackageWithHistoriesRaw = {
  package: PackageRaw;
  histories: PackageHistoryRaw[];
};

export type PackageDetailsRaw = {
  package: PackageRaw;
  recipient: UserRaw;
  author: UserRaw;
  deliveryPerson: UserRaw | null;
  attachment: AttachmentRaw | null;
  histories: PackageHistoryRaw[];
};

export class DrizzlePackageMapper {
  public static toPersistence(
    pkg: Package,
    version: number
  ): { packageRow: PackageRaw; newHistories: PackageHistoryRaw[] } {
    const packageRow: PackageRaw = {
      id: pkg.id.toString(),
      code: pkg.code.value,
      status: pkg.status.value,
      name: pkg.name,
      postalCode: pkg.postalCode.value,
      recipientAddress: pkg.recipientAddress,
      attachmentId: pkg.attachment?.attachmentId.toString() ?? null,
      recipientId: pkg.recipientId.toString(),
      deliveryPersonId: pkg.deliveryPersonId?.toString() ?? null,
      authorId: pkg.authorId.toString(),
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
      deliveredAt: pkg.deliveredAt,
      version,
    };

    const newHistories: PackageHistoryRaw[] = pkg.histories
      .getNewItems()
      .map((h) => ({
        id: h.id.toString(),
        packageId: h.packageId.toString(),
        fromStatus: h.fromStatus?.value ?? null,
        toStatus: h.toStatus.value,
        authorId: h.authorId.toString(),
        deliveryPersonId: h.deliveryPersonId?.toString() ?? null,
        description: h.description,
        createdAt: h.createdAt,
        version: 1,
      }));

    return { packageRow, newHistories };
  }

  public static toDomain(raw: PackageWithHistoriesRaw): Package {
    const code = PackageCode.create(raw.package.code);

    if (code.isLeft()) {
      throw new Error(`Invalid package code in database: ${raw.package.code}`);
    }

    const status = PackageStatus.create(raw.package.status);

    if (status.isLeft()) {
      throw new Error(
        `Invalid package status in database: ${raw.package.status}`
      );
    }

    const postalCode = PostalCode.create({ value: raw.package.postalCode });

    if (postalCode.isLeft()) {
      throw new Error(
        `Invalid postal code in database: ${raw.package.postalCode}`
      );
    }

    const histories = raw.histories.map((h) => {
      const toStatus = PackageStatus.create(h.toStatus);

      if (toStatus.isLeft()) {
        throw new Error(`Invalid toStatus in package history: ${h.toStatus}`);
      }

      let fromStatus: PackageStatus | null = null;

      if (h.fromStatus) {
        const r = PackageStatus.create(h.fromStatus);
        if (r.isRight()) fromStatus = r.value;
      }

      if (!h.packageId) {
        throw new Error(`Package history ${h.id} has no packageId in database`);
      }

      return PackageHistory.create(
        {
          packageId: new UniqueEntityId(h.packageId),
          fromStatus,
          toStatus: toStatus.value,
          authorId: new UniqueEntityId(h.authorId),
          deliveryPersonId: h.deliveryPersonId
            ? new UniqueEntityId(h.deliveryPersonId)
            : null,
          description: h.description ?? null,
          createdAt: h.createdAt,
        },
        new UniqueEntityId(h.id)
      );
    });

    let attachment: PackageAttachment | null = null;

    if (raw.package.attachmentId) {
      attachment = PackageAttachment.create({
        attachmentId: new UniqueEntityId(raw.package.attachmentId),
        PackageId: new UniqueEntityId(raw.package.id),
      });
    }

    const packageResult = Package.create(
      {
        id: new UniqueEntityId(raw.package.id),
        name: raw.package.name,
        code: code.value,
        recipientId: new UniqueEntityId(raw.package.recipientId),
        recipientAddress: raw.package.recipientAddress,
        deliveryPersonId: raw.package.deliveryPersonId
          ? new UniqueEntityId(raw.package.deliveryPersonId)
          : null,
        authorId: new UniqueEntityId(raw.package.authorId),
        status: status.value,
        postalCode: postalCode.value,
        attachment,
        histories: new PackageHistoryList(histories),
        createdAt: raw.package.createdAt,
        updatedAt: raw.package.updatedAt,
        deliveredAt: raw.package.deliveredAt,
      },
      new UniqueEntityId(raw.package.id)
    );

    if (packageResult.isLeft()) {
      throw new Error(
        `Failed to reconstruct Package from database: ${packageResult.value.message}`
      );
    }

    return packageResult.value;
  }

  public static toDetailsDomain(raw: PackageDetailsRaw): PackageDetails {
    const code = PackageCode.create(raw.package.code);

    if (code.isLeft()) {
      throw new Error(`Invalid package code in database: ${raw.package.code}`);
    }

    const status = PackageStatus.create(raw.package.status);

    if (status.isLeft()) {
      throw new Error(
        `Invalid package status in database: ${raw.package.status}`
      );
    }

    const postalCode = PostalCode.create({ value: raw.package.postalCode });

    if (postalCode.isLeft()) {
      throw new Error(
        `Invalid postal code in database: ${raw.package.postalCode}`
      );
    }

    const histories = raw.histories.map((h) => {
      const toStatus = PackageStatus.create(h.toStatus);

      if (toStatus.isLeft()) {
        throw new Error(`Invalid toStatus in package history: ${h.toStatus}`);
      }

      let fromStatus: PackageStatus | null = null;

      if (h.fromStatus) {
        const r = PackageStatus.create(h.fromStatus);
        if (r.isRight()) fromStatus = r.value;
      }

      if (!h.packageId) {
        throw new Error(`Package history ${h.id} has no packageId in database`);
      }

      return PackageHistory.create(
        {
          packageId: new UniqueEntityId(h.packageId),
          fromStatus,
          toStatus: toStatus.value,
          authorId: new UniqueEntityId(h.authorId),
          deliveryPersonId: h.deliveryPersonId
            ? new UniqueEntityId(h.deliveryPersonId)
            : null,
          description: h.description ?? null,
          createdAt: h.createdAt,
        },
        new UniqueEntityId(h.id)
      );
    });

    const attachment = raw.attachment
      ? Attachment.create(
          { title: raw.attachment.title, key: raw.attachment.key },
          new UniqueEntityId(raw.attachment.id)
        )
      : null;

    return PackageDetails.create({
      packageId: new UniqueEntityId(raw.package.id),
      name: raw.package.name,
      code: code.value,
      status: status.value,
      postalCode: postalCode.value,
      recipientAddress: raw.package.recipientAddress,
      recipient: {
        id: new UniqueEntityId(raw.recipient.id),
        name: raw.recipient.name,
        email: raw.recipient.email,
      },
      author: {
        id: new UniqueEntityId(raw.author.id),
        name: raw.author.name,
      },
      deliveryPerson: raw.deliveryPerson
        ? {
            id: new UniqueEntityId(raw.deliveryPerson.id),
            name: raw.deliveryPerson.name,
          }
        : null,
      attachment,
      histories,
      createdAt: raw.package.createdAt,
      updatedAt: raw.package.updatedAt,
      deliveredAt: raw.package.deliveredAt,
    });
  }
}
