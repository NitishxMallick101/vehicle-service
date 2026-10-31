import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VehicleDataTransformer } from './vehicle-data.transformer';
import { VehicleRepository } from './vehicle.repository';
import { VehicleXmlParser } from './vehicle-xml.parser';
import { VpicClient } from './vpic.client';
import { VehicleType } from './vehicle-data.types';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private readonly concurrency: number;

  constructor(
    private readonly client: VpicClient,
    private readonly parser: VehicleXmlParser,
    private readonly transformer: VehicleDataTransformer,
    private readonly repository: VehicleRepository,
    config: ConfigService,
  ) {
    this.concurrency = Number(config.getOrThrow<string>('VPIC_CONCURRENCY'));
  }

  async ingest(): Promise<number> {
    const startedAt = Date.now();
    this.logger.log(JSON.stringify({ event: 'vehicle_ingestion_started' }));
    try {
      const makes = this.parser.parseMakes(await this.client.getAllMakesXml());
      this.logger.debug(
        JSON.stringify({
          event: 'vehicle_makes_parsed',
          makeCount: makes.length,
          concurrency: this.concurrency,
        }),
      );
      if (makes.length === 0) {
        throw new Error('vPIC returned no vehicle makes; existing data was not changed');
      }
      const vehicleTypesByMake = new Map<number, VehicleType[]>();
      await this.mapWithConcurrency(makes, async (make) => {
        const xml = await this.client.getVehicleTypesXml(make.makeId);
        const vehicleTypes = this.parser.parseVehicleTypes(xml, make.makeId);
        vehicleTypesByMake.set(make.makeId, vehicleTypes);
        this.logger.verbose(
          JSON.stringify({
            event: 'vehicle_types_fetched',
            makeId: make.makeId,
            vehicleTypeCount: vehicleTypes.length,
          }),
        );
      });

      this.logger.debug(
        JSON.stringify({
          event: 'vehicle_type_fetch_completed',
          makeCount: vehicleTypesByMake.size,
        }),
      );
      const unified = this.transformer.unify(makes, vehicleTypesByMake);
      this.logger.debug(
        JSON.stringify({
          event: 'vehicle_data_transformed',
          makeCount: unified.length,
        }),
      );
      await this.repository.replaceAll(unified);
      this.logger.log(
        JSON.stringify({
          event: 'vehicle_ingestion_completed',
          makeCount: unified.length,
          durationMs: Date.now() - startedAt,
          vehicleTypeCount: unified.reduce(
            (total, make) => total + make.vehicleTypes.length,
            0,
          ),
        }),
      );
      return unified.length;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'vehicle_ingestion_failed',
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      throw error;
    }
  }

  private async mapWithConcurrency<T>(
    items: T[],
    callback: (item: T) => Promise<void>,
  ): Promise<void> {
    let nextIndex = 0;
    const workerCount = Math.min(this.concurrency, items.length);
    this.logger.debug(
      JSON.stringify({
        event: 'concurrent_work_started',
        itemCount: items.length,
        workerCount,
      }),
    );
    const worker = async (): Promise<void> => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;
        if (index >= items.length) {
          return;
        }
        await callback(items[index]);
      }
    };
    await Promise.all(
      Array.from(
        { length: workerCount },
        () => worker(),
      ),
    );
    this.logger.debug(
      JSON.stringify({
        event: 'concurrent_work_completed',
        itemCount: items.length,
        workerCount,
      }),
    );
  }
}
