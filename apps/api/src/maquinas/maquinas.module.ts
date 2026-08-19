import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { MaquinasController } from './maquinas.controller';
import { MaquinasService } from './maquinas.service';

@Module({
  imports: [StorageModule],
  controllers: [MaquinasController],
  providers: [MaquinasService],
  exports: [MaquinasService],
})
export class MaquinasModule {}
