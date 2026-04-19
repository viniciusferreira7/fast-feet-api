import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { EmailVerificationsRepository } from '@/domain/delivery/application/repositories/email-verifications-repository';
import type { EmailVerification } from '@/domain/delivery/enterprise/entities/email-verification';
import { DrizzleService } from '../drizzle.service';
import { DrizzleEmailVerificationMapper } from '../mappers/drizzle-email-verification-mapper';
import { emailsCodes } from '../schema';

@Injectable()
export class DrizzleEmailVerificationsRepository
  implements EmailVerificationsRepository
{
  constructor(private readonly drizzleService: DrizzleService) {}

  public async create(data: EmailVerification): Promise<EmailVerification> {
    const raw = DrizzleEmailVerificationMapper.toPersistence(data);

    await this.drizzleService.db.insert(emailsCodes).values(raw);

    return DrizzleEmailVerificationMapper.toDomain(raw);
  }

  public async findByCode(code: string): Promise<EmailVerification | null> {
    const [row] = await this.drizzleService.db
      .select()
      .from(emailsCodes)
      .where(eq(emailsCodes.code, code));

    if (!row) return null;

    return DrizzleEmailVerificationMapper.toDomain(row);
  }

  public async deleteByCode(code: string): Promise<EmailVerification | null> {
    const [row] = await this.drizzleService.db
      .delete(emailsCodes)
      .where(eq(emailsCodes.code, code))
      .returning();

    if (!row) return null;

    return DrizzleEmailVerificationMapper.toDomain(row);
  }
}
