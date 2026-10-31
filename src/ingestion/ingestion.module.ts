import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MakeEntity } from '../database/entities/make.entity';
import { VehicleTypeEntity } from '../database/entities/vehicle-type.entity';
import { IngestionService } from './ingestion.service';
import { VehicleDataTransformer } from './vehicle-data.transformer';
import { VehicleRepository } from './vehicle.repository';
import { VehicleXmlParser } from './vehicle-xml.parser';
import { VpicClient } from './vpic.client';

@Module({
  imports: [TypeOrmModule.forFeature([MakeEntity, VehicleTypeEntity])],
  providers: [
    IngestionService,
    VehicleDataTransformer,
    VehicleRepository,
    VehicleXmlParser,
    VpicClient,
  ],
  exports: [IngestionService, VehicleRepository],
})
export class IngestionModule {}
