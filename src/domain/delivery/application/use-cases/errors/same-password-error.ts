import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class SamePasswordError extends Error implements ErrorImplementation {
  constructor() {
    super('You cannot update password passing old password as new password');
  }
}
