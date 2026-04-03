export interface HttpClientOptions {
  retries?: number;
}

export abstract class HttpClient {
  abstract get<T>(url: string, options?: HttpClientOptions): Promise<T>;
}
