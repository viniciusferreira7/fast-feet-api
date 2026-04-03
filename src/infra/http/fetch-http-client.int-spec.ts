import { makeModuleRef } from 'test/factories/make-module-ref';
import { HttpClient } from '@/domain/delivery/application/http/http-client';
import { EnvService } from '@/infra/env/env.service';
import { FetchHttpClient } from './fetch-http-client';

const UNREACHABLE_URL = 'https://0.0.0.0:1/';

let client: FetchHttpClient;
let envService: EnvService;

describe('FetchHttpClient', () => {
  beforeEach(async () => {
    const moduleRef = await makeModuleRef();

    client = moduleRef.get(HttpClient, { strict: false }) as FetchHttpClient;
    envService = moduleRef.get(EnvService, { strict: false });
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  it('should return parsed JSON from jsonplaceholder', async () => {
    const url = `${envService.get('JSON_PLACEHOLDER_URL')}/users/1`;
    const result = await client.get<{ id: number }>(url);

    expect(result).toMatchObject({ id: 1 });
  });

  it('should return parsed JSON from httpbin', async () => {
    const url = `${envService.get('HTTPBIN_URL')}/get`;
    const result = await client.get<{ url: string }>(url);

    expect(result).toMatchObject({
      url: `${envService.get('HTTPBIN_URL')}/get`,
    });
  });

  it('should throw HTTP error on non-OK response', async () => {
    const url = `${envService.get('JSON_PLACEHOLDER_URL')}/users/99999`;

    await expect(client.get(url)).rejects.toThrow(/HTTP error/);
  });

  it('should throw Network error when host is unreachable', async () => {
    await expect(client.get(UNREACHABLE_URL)).rejects.toThrow('Network error');
  });

  it('should retry and eventually succeed', async () => {
    const url = `${envService.get('JSON_PLACEHOLDER_URL')}/users/1`;
    const result = await client.get<{ id: number }>(url, { retries: 2 });

    expect(result).toMatchObject({ id: 1 });
  });
});
