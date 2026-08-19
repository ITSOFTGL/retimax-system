import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ComercialController } from './comercial.controller';
import { ComercialService } from './comercial.service';

@Module({
  imports: [StorageModule],
  controllers: [ComercialController],
  providers: [ComercialService],
})
export class ComercialModule {}
