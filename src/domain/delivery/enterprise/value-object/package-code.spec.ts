import { generateFutureUlid } from 'test/utils/generate-future-ulid';
import { InvalidatePackageCodeError } from '../../errors/invalidate-package-code-error';
import { PackageCode } from './package-code';

describe('Package code', () => {
  it('should be able to create validate package code', () => {
    const code = PackageCode.create();

    expect(code).toBeInstanceOf(PackageCode);
  });

  it('should be able to return code from package code class', () => {
    const code = PackageCode.create();

    expect(code.value).toEqual(expect.any(String));
  });

  it('should normalize code to uppercase', () => {
    const lowerCaseUlid = '01hzyz9z7x6kqjv9d5f0p2w3r4';

    const code = PackageCode.create(lowerCaseUlid);

    expect(code.value).toBe(lowerCaseUlid.toUpperCase());
  });

  it('should be able to generate code from package code class', () => {
    const code = PackageCode.generate();

    expect(code).toBeInstanceOf(PackageCode);
    expect(code.value).toEqual(expect.any(String));
  });

  it('should not allow ULID with invalid length', () => {
    expect(() => {
      PackageCode.create('01HZYZ9Z7X6KQJ');
    }).toThrow(InvalidatePackageCodeError);
  });

  it('should not allow ULID with invalid characters', () => {
    expect(() => {
      PackageCode.create('01HZYZ9Z7X6KQJ@#$%^&*()123');
    }).toThrow(InvalidatePackageCodeError);
  });

  it('should not able to register invalidate code with wrong ULID', () => {
    expect(() => {
      PackageCode.create('dfdsgDGSD5343');
    }).toThrow(InvalidatePackageCodeError);
  });

  it('should not able to register code which timestamp is on future', () => {
    const futureUlid = generateFutureUlid(10);

    expect(() => {
      PackageCode.create(futureUlid);
    }).toThrow(InvalidatePackageCodeError);
  });
});
