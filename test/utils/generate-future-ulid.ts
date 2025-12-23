/**
 * Generates a ULID-like identifier with a timestamp set in the future.
 *
 * ⚠️ This function is intended to be used **only in tests**.
 * It produces a valid ULID format (26 chars, Base32 Crockford),
 * but with a timestamp that exceeds the current time, which is
 * useful for testing domain validations that must reject future timestamps.
 *
 * ULID structure:
 * - First 10 characters: timestamp (Base32 Crockford encoded)
 * - Last 16 characters: random part
 *
 * @param yearsInFuture - Number of years to add to the current date
 *                        when generating the timestamp (default: 100 years).
 *
 * @returns A ULID-like string with a future timestamp.
 *
 * @example
 * ```ts
 * const futureUlid = generateFutureUlid();
 *
 * expect(() => {
 *   PackageCode.create(futureUlid);
 * }).toThrow(InvalidatePackageCodeError);
 * ```
 */
export function generateFutureUlid(yearsInFuture = 100): string {
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + yearsInFuture);

  let time = futureDate.getTime();
  let timeStr = '';

  for (let i = 9; i >= 0; i--) {
    const mod = time % 32;
    timeStr = ENCODING[mod] + timeStr;
    time = Math.floor(time / 32);
  }

  let randomStr = '';
  for (let i = 0; i < 16; i++) {
    randomStr += ENCODING[Math.floor(Math.random() * 32)];
  }

  return timeStr + randomStr;
}
