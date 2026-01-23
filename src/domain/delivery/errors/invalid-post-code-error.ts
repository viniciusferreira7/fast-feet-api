import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class InvalidaPostCode extends Error implements ErrorImplementation {
  constructor() {
    super('Invalid Post Code');
  }
}
