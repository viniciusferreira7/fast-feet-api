import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class InvalidateCpfError extends Error implements ErrorImplementation {
  constructor() {
    super('Invalidate CPF');
  }
}
