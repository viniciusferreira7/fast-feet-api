import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class InvalidPostalCode extends Error implements ErrorImplementation {
  constructor() {
    super('Invalid Postal Code');
  }
}
