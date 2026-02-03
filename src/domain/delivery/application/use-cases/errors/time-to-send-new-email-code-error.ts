import type { ErrorImplementation } from '@/core/errors/error-implementation';

export class TimeToSendNewEmailCodeError
  extends Error
  implements ErrorImplementation
{
  constructor(timeInMinutes: number) {
    super(
      `Wait until existing e-mail code expired, to send new e-mail code rest time: ${timeInMinutes > 1 ? `${timeInMinutes} minutes` : timeInMinutes === 0 ? `${timeInMinutes} minutes` : `${timeInMinutes} minute`}`
    );
  }
}
