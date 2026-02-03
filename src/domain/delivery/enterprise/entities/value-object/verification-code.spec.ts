import { InvalidEmailCodeExpiredError } from '@/domain/delivery/errors/invalid-email-code-error';
import { VerificationCode } from './verification-code';

describe('VerificationCode', () => {
  describe('generateCode', () => {
    it('should generate an 8-digit code', () => {
      const code = VerificationCode.generateCode();

      expect(code).toHaveLength(8);
      expect(code).toMatch(/^\d{8}$/);
    });

    it('should generate different codes each time', () => {
      const code1 = VerificationCode.generateCode();
      const code2 = VerificationCode.generateCode();
      const code3 = VerificationCode.generateCode();

      expect(code1).not.toBe(code2);
      expect(code2).not.toBe(code3);
      expect(code1).not.toBe(code3);
    });

    it('should pad codes with leading zeros', () => {
      for (let i = 0; i < 10; i++) {
        const code = VerificationCode.generateCode();
        expect(code).toHaveLength(8);
        expect(code).toMatch(/^\d{8}$/);
      }
    });
  });

  describe('isValidFormatOfCode', () => {
    it('should accept valid 8-digit codes', () => {
      expect(VerificationCode.isValidFormatOfCode('12345678')).toBe(true);
      expect(VerificationCode.isValidFormatOfCode('00000000')).toBe(true);
      expect(VerificationCode.isValidFormatOfCode('99999999')).toBe(true);
      expect(VerificationCode.isValidFormatOfCode('01234567')).toBe(true);
    });

    it('should reject codes with incorrect length', () => {
      expect(VerificationCode.isValidFormatOfCode('1234567')).toBe(false);
      expect(VerificationCode.isValidFormatOfCode('123456789')).toBe(false);
      expect(VerificationCode.isValidFormatOfCode('123')).toBe(false);
      expect(VerificationCode.isValidFormatOfCode('')).toBe(false);
    });

    it('should reject codes with non-digit characters', () => {
      expect(VerificationCode.isValidFormatOfCode('1234567a')).toBe(false);
      expect(VerificationCode.isValidFormatOfCode('12345 78')).toBe(false);
      expect(VerificationCode.isValidFormatOfCode('12345-78')).toBe(false);
      expect(VerificationCode.isValidFormatOfCode('abcdefgh')).toBe(false);
    });
  });

  describe('create', () => {
    it('should create verification code with auto-generated value', () => {
      const result = VerificationCode.create();

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value).toBeInstanceOf(VerificationCode);
        expect(result.value.code).toMatch(/^\d{8}$/);
      }
    });

    it('should create verification code with provided valid value', () => {
      const result = VerificationCode.create('12345678');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.code).toBe('12345678');
      }
    });

    it('should reject invalid code format', () => {
      const result = VerificationCode.create('invalid');

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidEmailCodeExpiredError);
      }
    });

    it('should reject code with wrong length', () => {
      const result = VerificationCode.create('123456');

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidEmailCodeExpiredError);
      }
    });

    it('should accept code with leading zeros', () => {
      const result = VerificationCode.create('00012345');

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value.code).toBe('00012345');
      }
    });
  });

  describe('value equality', () => {
    it('should have same value for codes with same string', () => {
      const code1 = VerificationCode.create('12345678');
      const code2 = VerificationCode.create('12345678');

      expect(code1.isRight()).toBe(true);
      expect(code2.isRight()).toBe(true);

      if (code1.isRight() && code2.isRight()) {
        expect(code1.value.equals(code2.value)).toBe(true);
      }
    });

    it('should have different values for codes with different strings', () => {
      const code1 = VerificationCode.create('12345678');
      const code2 = VerificationCode.create('87654321');

      expect(code1.isRight()).toBe(true);
      expect(code2.isRight()).toBe(true);

      if (code1.isRight() && code2.isRight()) {
        expect(code1.value.equals(code2.value)).toBe(false);
      }
    });
  });
});
