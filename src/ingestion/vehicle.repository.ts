import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MakeEntity } from '../database/entities/make.entity';
import { VehicleTypeEntity } from '../database/entities/vehicle-type.entity';
import { UnifiedVehicleMake } from './vehicle-data.types';

@Injectable()
export class VehicleRepository {
  private readonly logger = new Logger(VehicleRepository.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(MakeEntity)
    private readonly makeRepository: Repository<MakeEntity>,
  ) {}

  async replaceAll(data: UnifiedVehicleMake[]): Promise<void> {
    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.query('DELETE FROM "makes"');
        for (const batch of this.chunks(data, 500)) {
          await manager.insert(
            MakeEntity,
            batch.map(({ makeId, makeName }) => ({ makeId, makeName })),
          );
        }
        const vehicleTypes = data.flatMap(({ makeId, vehicleTypes: types }) =>
          types.map(({ typeId, typeName }) => ({ makeId, typeId, typeName })),
        );
        for (const batch of this.chunks(vehicleTypes, 1000)) {
          await manager.insert(VehicleTypeEntity, batch);
        }
      });
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'vehicle_persistence_failed',
          makeCount: data.length,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      throw error;
    }
  }

  findMakes(limit: number, offset: number): Promise<MakeEntity[]> {
    return this.makeRepository.find({
      relations: { vehicleTypes: true },
      order: { makeId: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  findMake(makeId: number): Promise<MakeEntity | null> {
    return this.makeRepository.findOne({
      where: { makeId },
      relations: { vehicleTypes: true },
    });
  }

  private chunks<T>(items: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      result.push(items.slice(index, index + size));
    }
    return result;
  }
}
