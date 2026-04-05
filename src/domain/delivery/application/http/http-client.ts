export interface HttpClientOptions {
  retries?: number;
  maxTimeout?: number;
  minTimeout?: number;
  factor?: 1 | 2;
  randomize?: boolean;
  maxRetryTime?: number;
}

export abstract class HttpClient {
  abstract get<T>(url: string, options?: HttpClientOptions): Promise<T>;
}
