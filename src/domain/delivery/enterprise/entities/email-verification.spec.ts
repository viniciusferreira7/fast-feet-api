import { UniqueEntityId } from '@/core/entities/value-object/unique-entity-id';
import { EmailCodeError } from '../../errors/email-code-expired-error';
import { EmailVerification } from './email-verification';
import { VerificationCode } from './value-object/verification-code';

describe('EmailVerification', () => {
  describe('create - new verification', () => {
    it('should create a new email verification with generated code', () => {
      const result = EmailVerification.create({});

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value).toBeInstanceOf(EmailVerification);
        expect(result.value.code).toBeInstanceOf(VerificationCode);
        expect(result.value.createdAt).toBeInstanceOf(Date);
        expect(result.value.validatedAt).toBeNull();
      }
    });

    it('should create email verification with current timestamp', () => {
      const before = Date.now();
      const result = EmailVerification.create({});
      const after = Date.now();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        const createdTime = result.value.createdAt.getTime();
        expect(createdTime).toBeGreaterThanOrEqual(before);
        expect(createdTime).toBeLessThanOrEqual(after);
      }
    });
  });

  describe('create - existing verification', () => {
    it('should reconstitute existing email verification with valid code', () => {
      const code = VerificationCode.create('12345678');
      expect(code.isRight()).toBe(true);

      if (code.isRight()) {
        const id = new UniqueEntityId();
        const createdAt = new Date();

        const result = EmailVerification.create(
          {
            code: code.value,
            createdAt,
            validatedAt: null,
          },
          id
        );

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.id).toBe(id);
          expect(result.value.code).toBe(code.value);
          expect(result.value.createdAt).toBe(createdAt);
          expect(result.value.validatedAt).toBeNull();
        }
      }
    });

    it('should reject expired verification code', () => {
      const code = VerificationCode.create('12345678');
      expect(code.isRight()).toBe(true);

      if (code.isRight()) {
        const id = new UniqueEntityId();
        const createdAt = new Date(Date.now() - 6 * 60 * 1000);

        const result = EmailVerification.create(
          {
            code: code.value,
            createdAt,
            validatedAt: null,
          },
          id
        );

        expect(result.isLeft()).toBe(true);
        if (result.isLeft()) {
          expect(result.value).toBeInstanceOf(EmailCodeError);
        }
      }
    });

    it('should accept verification code created exactly 5 minutes ago', () => {
      const code = VerificationCode.create('12345678');
      expect(code.isRight()).toBe(true);

      if (code.isRight()) {
        const id = new UniqueEntityId();
        const createdAt = new Date(Date.now() - 5 * 60 * 1000);

        const result = EmailVerification.create(
          {
            code: code.value,
            createdAt,
            validatedAt: null,
          },
          id
        );

        expect(result.isRight()).toBe(true);
      }
    });

    it('should accept verification code created 4 minutes ago', () => {
      const code = VerificationCode.create('12345678');
      expect(code.isRight()).toBe(true);

      if (code.isRight()) {
        const id = new UniqueEntityId();
        const createdAt = new Date(Date.now() - 4 * 60 * 1000);

        const result = EmailVerification.create(
          {
            code: code.value,
            createdAt,
            validatedAt: null,
          },
          id
        );

        expect(result.isRight()).toBe(true);
      }
    });
  });

  describe('validatedAt handling', () => {
    it('should preserve validatedAt when reconstituting', () => {
      const code = VerificationCode.create('12345678');
      expect(code.isRight()).toBe(true);

      if (code.isRight()) {
        const id = new UniqueEntityId();
        const createdAt = new Date();
        const validatedAt = new Date();

        const result = EmailVerification.create(
          {
            code: code.value,
            createdAt,
            validatedAt,
          },
          id
        );

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value.validatedAt).toBe(validatedAt);
        }
      }
    });
  });
});
