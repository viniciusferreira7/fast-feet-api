import { Module } from '@nestjs/common';
import { HttpClient } from '@/domain/delivery/application/http/http-client';
import { FetchHttpClient } from './fetch-http-client';

@Module({
  providers: [
    {
      provide: HttpClient,
      useClass: FetchHttpClient,
    },
  ],
  exports: [HttpClient],
})
export class HttpModule {}
