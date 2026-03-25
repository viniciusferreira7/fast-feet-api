import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class InvalidMarkAsReadRequestError
  extends Error
  implements ErrorImplementation
{
  constructor() {
    super(
      'Please select the notifications you want to mark as read or choose to mark all.'
    );
  }
}
