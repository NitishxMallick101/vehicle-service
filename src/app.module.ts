import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehicleGraphqlModule } from './graphql/graphql.module';
import { MakeEntity } from './database/entities/make.entity';
import { VehicleTypeEntity } from './database/entities/vehicle-type.entity';
import { IngestionModule } from './ingestion/ingestion.module';
import {
  configurationSchema,
  DEFAULT_DATABASE_URL,
} from './config/configuration';
import { LifecycleLogger } from './lifecycle.logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (environment) => {
        const { error, value } = configurationSchema.validate(environment, {
          allowUnknown: true,
          abortEarly: false,
        });
        if (error) {
          throw error;
        }
        return value;
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL') ?? DEFAULT_DATABASE_URL,
        ssl:
          config.get<boolean>('DATABASE_SSL') === true
            ? { rejectUnauthorized: true }
            : false,
        extra: {
          max: Number(config.getOrThrow<string>('DATABASE_POOL_SIZE')),
        },
        entities: [MakeEntity, VehicleTypeEntity],
        synchronize: false,
        migrationsRun: false,
      }),
    }),
    IngestionModule,
    VehicleGraphqlModule,
  ],
  providers: [LifecycleLogger],
})
export class AppModule {}
