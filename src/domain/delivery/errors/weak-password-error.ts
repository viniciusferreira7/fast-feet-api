import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class WeakPasswordError extends Error implements ErrorImplementation {
  constructor(message?: string) {
    super(message ?? 'Weak password');
  }
}
