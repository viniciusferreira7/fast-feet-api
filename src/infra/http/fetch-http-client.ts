import { Injectable } from '@nestjs/common';
import pRetry from 'p-retry';
import {
  HttpClient,
  type HttpClientOptions,
} from '@/domain/delivery/application/http/http-client';

@Injectable()
export class FetchHttpClient implements HttpClient {
  async get<T>(url: string, options?: HttpClientOptions): Promise<T> {
    return pRetry(
      async () => {
        let response: Response;

        try {
          response = await fetch(url);
        } catch {
          throw new Error('Network error');
        }

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        try {
          return (await response.json()) as T;
        } catch {
          throw new Error('Invalid JSON response');
        }
      },
      { retries: options?.retries ?? 0 }
    );
  }
}
