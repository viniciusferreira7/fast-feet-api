import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class SameEmailError extends Error implements ErrorImplementation {
  constructor() {
    super('You cannot update email passing old email as new email');
  }
}
