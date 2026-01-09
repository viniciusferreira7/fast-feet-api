import { generateFutureUlid } from 'test/utils/generate-future-ulid';
import { InvalidatePackageCodeError } from '@/domain/delivery/errors/invalidate-package-code-error';
import { PackageCode } from './package-code';

describe('Package code', () => {
  it('should be able to create validate package code', () => {
    const result = PackageCode.create();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toBeInstanceOf(PackageCode);
    }
  });

  it('should be able to return code from package code class', () => {
    const result = PackageCode.create();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toEqual(expect.any(String));
    }
  });

  it('should normalize code to uppercase', () => {
    const lowerCaseUlid = '01hzyz9z7x6kqjv9d5f0p2w3r4';

    const result = PackageCode.create(lowerCaseUlid);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.value).toBe(lowerCaseUlid.toUpperCase());
    }
  });

  it('should be able to generate code from package code class', () => {
    const result = PackageCode.generate();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toBeInstanceOf(PackageCode);
      expect(result.value.value).toEqual(expect.any(String));
    }
  });

  it('should not allow ULID with invalid length', () => {
    const result = PackageCode.create('01HZYZ9Z7X6KQJ');

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidatePackageCodeError);
    }
  });

  it('should not allow ULID with invalid characters', () => {
    const result = PackageCode.create('01HZYZ9Z7X6KQJ@#$%^&*()123');

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidatePackageCodeError);
    }
  });

  it('should not able to register invalidate code with wrong ULID', () => {
    const result = PackageCode.create('dfdsgDGSD5343');

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidatePackageCodeError);
    }
  });

  it('should not able to register code which timestamp is on future', () => {
    const futureUlid = generateFutureUlid(10);

    const result = PackageCode.create(futureUlid);

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidatePackageCodeError);
    }
  });
});
