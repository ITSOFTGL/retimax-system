import { Module } from '@nestjs/common';
import { IntervencionesController } from './intervenciones.controller';
import { IntervencionesService } from './intervenciones.service';

@Module({
  controllers: [IntervencionesController],
  providers: [IntervencionesService],
  exports: [IntervencionesService],
})
export class IntervencionesModule {}
