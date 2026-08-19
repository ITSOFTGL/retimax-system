import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { STORAGE_SERVICE } from './storage.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageService,
    {
      provide: STORAGE_SERVICE,
      useExisting: LocalStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
