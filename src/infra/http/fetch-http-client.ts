import { Injectable } from '@nestjs/common';
import { HttpClient } from '@/domain/delivery/application/http/http-client';

@Injectable()
export class FetchHttpClient implements HttpClient {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    return response.json() as Promise<T>;
  }
}
