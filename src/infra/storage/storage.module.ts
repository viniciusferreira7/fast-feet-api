import { Module } from '@nestjs/common';
import { Uploader } from '@/domain/delivery/application/storage/uploader';
import { R2Storage } from './r2-storage';

@Module({
  providers: [
    {
      provide: Uploader,
      useClass: R2Storage,
    },
  ],
  exports: [Uploader],
})
export class StorageModule {}
