import type { Response } from 'supertest';

/**
 * Fails fast when a request made purely to set up a test did not succeed.
 *
 * Setup helpers return the raw response, so a swallowed 4xx used to surface
 * much later as an unrelated-looking error (a missing email code, an undefined
 * access token). Reporting status and body at the failing step points straight
 * at the real cause.
 */
export function assertSetupSucceeded(
  response: Response,
  label: string
): Response {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      `[e2e setup] ${label} responded ${response.status}: ${JSON.stringify(response.body)}`
    );
  }

  return response;
}
