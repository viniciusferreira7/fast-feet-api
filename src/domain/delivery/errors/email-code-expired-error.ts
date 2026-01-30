import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class EmailCodeError extends Error implements ErrorImplementation {
  constructor() {
    super('Code e-mail expired');
  }
}
