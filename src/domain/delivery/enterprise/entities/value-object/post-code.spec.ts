import { InvalidaPostCode } from '@/domain/delivery/errors/invalid-post-code-error';
import { PostCode } from './post-code';

describe('Post Code', () => {
  describe('create', () => {
    it('should be able to create valid post code with hyphen', () => {
      const result = PostCode.create({ value: '12345-678' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value).toBeInstanceOf(PostCode);
        expect(result.value.value).toBe('12345-678');
      }
    });

    it('should be able to create valid post code without hyphen', () => {
      const result = PostCode.create({ value: '12345678' });

      expect(result.isRight()).toBe(true);
      if (result.isRight()) {
        expect(result.value).toBeInstanceOf(PostCode);
        expect(result.value.value).toBe('12345678');
      }
    });

    it('should be able to create all valid post code formats', () => {
      const validPostCodes = [
        '00000-000',
        '12345-678',
        '99999-999',
        '00000000',
        '12345678',
        '99999999',
      ];

      validPostCodes.forEach((postCodeValue) => {
        const result = PostCode.create({ value: postCodeValue });

        expect(result.isRight()).toBe(true);
        if (result.isRight()) {
          expect(result.value).toBeInstanceOf(PostCode);
          expect(result.value.value).toBe(postCodeValue);
        }
      });
    });

    it('should not be able to create invalid post code with letters', () => {
      const result = PostCode.create({ value: '12345-abc' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidaPostCode);
      }
    });

    it('should not be able to create invalid post code with wrong format', () => {
      const result = PostCode.create({ value: '123-456' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidaPostCode);
      }
    });

    it('should not be able to create post code with too few digits', () => {
      const result = PostCode.create({ value: '1234-567' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidaPostCode);
      }
    });

    it('should not be able to create post code with too many digits', () => {
      const result = PostCode.create({ value: '123456-789' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidaPostCode);
      }
    });

    it('should not be able to create post code with empty string', () => {
      const result = PostCode.create({ value: '' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidaPostCode);
      }
    });

    it('should not be able to create post code with special characters', () => {
      const result = PostCode.create({ value: '12345@678' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidaPostCode);
      }
    });

    it('should not be able to create post code with spaces', () => {
      const result = PostCode.create({ value: '12345 678' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidaPostCode);
      }
    });

    it('should not be able to create post code with only hyphen', () => {
      const result = PostCode.create({ value: '-' });

      expect(result.isLeft()).toBe(true);
      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(InvalidaPostCode);
      }
    });
  });

  describe('validate', () => {
    it('should validate post code with hyphen', () => {
      expect(PostCode.validate('12345-678')).toBe(true);
    });

    it('should validate post code without hyphen', () => {
      expect(PostCode.validate('12345678')).toBe(true);
    });

    it('should not validate post code with letters', () => {
      expect(PostCode.validate('12345-abc')).toBe(false);
    });

    it('should not validate post code with wrong format', () => {
      expect(PostCode.validate('123-456')).toBe(false);
    });

    it('should not validate empty string', () => {
      expect(PostCode.validate('')).toBe(false);
    });

    it('should not validate post code with spaces', () => {
      expect(PostCode.validate('12345 678')).toBe(false);
    });
  });
});
