import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { MakeEntity } from './entities/make.entity';
import { VehicleTypeEntity } from './entities/vehicle-type.entity';
import { CreateVehicleTables1730000000000 } from './migrations/1730000000000-CreateVehicleTables';
import { DEFAULT_DATABASE_URL } from '../config/configuration';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
  extra: {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
  },
  entities: [MakeEntity, VehicleTypeEntity],
  migrations: [CreateVehicleTables1730000000000],
  synchronize: false,
});
