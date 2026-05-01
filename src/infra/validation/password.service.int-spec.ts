import { makeModuleRef } from 'test/factories/make-module-ref';
import { WeakPasswordError } from '@/domain/delivery/errors/weak-password-error';
import { PasswordService } from './password.service';

let service: PasswordService;

describe('PasswordService', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    service = moduleRef.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return right when password is strong', () => {
    const password = 'correct-horse-battery-staple';

    const result = service.validate(password);

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.password).toBe(password);
    }
  });

  it('should return left with WeakPasswordError when password is weak', () => {
    const result = service.validate('123456');

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(WeakPasswordError);
    }
  });

  it('should include feedback suggestions in the error message', () => {
    const result = service.validate('abcdefgh');

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.message).toContain('Feedback:');
    }
  });

  it('should include warning in the error message when zxcvbn provides one', () => {
    const result = service.validate('password');

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.message).toContain('Warning:');
    }
  });
});
