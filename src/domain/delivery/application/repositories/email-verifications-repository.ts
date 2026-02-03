import type { EmailVerification } from '../../enterprise/entities/email-verification';

export abstract class EmailVerificationsRepository {
  abstract create(data: EmailVerification): Promise<EmailVerification>;
  abstract findByCode(code: string): Promise<EmailVerification | null>;
  abstract deleteByCode(code: string): Promise<EmailVerification | null>;
}
