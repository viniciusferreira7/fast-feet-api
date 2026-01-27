import { InvalidPostalCode } from '@/domain/delivery/errors/invalid-postal-code-error';
import { PostalCode } from './postal-code';

describe('Postal Code', () => {
  describe('create', () => {
    it('should be able to create valid postal code with hyphen', () => {
      const result = PostalCode.create({ value: '12345-678' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value).toBeInstanceOf(PostalCode);
        expect(result.value.value).toBe('12345-678');
      }
    });

    it('should be able to create valid postal code without hyphen', () => {
      const result = PostalCode.create({ value: '12345678' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value).toBeInstanceOf(PostalCode);
        expect(result.value.value).toBe('12345678');
      }
    });

    it('should be able to create all valid postal code formats', () => {
      const validPostalCodes = [
        '00000-000',
        '12345-678',
        '99999-999',
        '00000000',
        '12345678',
        '99999999',
      ];

      validPostalCodes.forEach((postalCodeValue) => {
        const result = PostalCode.create({ value: postalCodeValue });

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value).toBeInstanceOf(PostalCode);
          expect(result.value.value).toBe(postalCodeValue);
        }
      });
    });

    it('should not be able to create invalid postal code with letters', () => {
      const result = PostalCode.create({ value: '12345-abc' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidPostalCode);
      }
    });

    it('should not be able to create invalid postal code with wrong format', () => {
      const result = PostalCode.create({ value: '123-456' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidPostalCode);
      }
    });

    it('should not be able to create postal code with too few digits', () => {
      const result = PostalCode.create({ value: '1234-567' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidPostalCode);
      }
    });

    it('should not be able to create postal code with too many digits', () => {
      const result = PostalCode.create({ value: '123456-789' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidPostalCode);
      }
    });

    it('should not be able to create postal code with empty string', () => {
      const result = PostalCode.create({ value: '' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidPostalCode);
      }
    });

    it('should not be able to create postal code with special characters', () => {
      const result = PostalCode.create({ value: '12345@678' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidPostalCode);
      }
    });

    it('should not be able to create postal code with spaces', () => {
      const result = PostalCode.create({ value: '12345 678' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidPostalCode);
      }
    });

    it('should not be able to create postal code with only hyphen', () => {
      const result = PostalCode.create({ value: '-' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidPostalCode);
      }
    });
  });

  describe('validate', () => {
    it('should validate postal code with hyphen', () => {
      expect(PostalCode.validate('12345-678')).toBe(true);
    });

    it('should validate postal code without hyphen', () => {
      expect(PostalCode.validate('12345678')).toBe(true);
    });

    it('should not validate postal code with letters', () => {
      expect(PostalCode.validate('12345-abc')).toBe(false);
    });

    it('should not validate postal code with wrong format', () => {
      expect(PostalCode.validate('123-456')).toBe(false);
    });

    it('should not validate empty string', () => {
      expect(PostalCode.validate('')).toBe(false);
    });

    it('should not validate postal code with spaces', () => {
      expect(PostalCode.validate('12345 678')).toBe(false);
    });
  });
});
