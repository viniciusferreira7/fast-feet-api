export abstract class HttpClient {
  abstract get<T>(url: string): Promise<T>;
}
