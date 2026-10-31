import { BadRequestException, Logger } from '@nestjs/common';
import { Int, Query, Resolver, Args } from '@nestjs/graphql';
import { VehicleRepository } from '../ingestion/vehicle.repository';
import { VehicleMakeModel } from './vehicle-types.graphql-model';

@Resolver(() => VehicleMakeModel)
export class VehicleResolver {
  private readonly logger = new Logger(VehicleResolver.name);

  constructor(private readonly repository: VehicleRepository) {}

  @Query(() => [VehicleMakeModel], { name: 'makes' })
  async makes(
    @Args('limit', { type: () => Int, defaultValue: 100 }) limit: number,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number,
  ): Promise<VehicleMakeModel[]> {
    if (limit < 1 || limit > 500) {
      this.logger.warn(
        JSON.stringify({ event: 'graphql_invalid_arguments', field: 'makes', limit }),
      );
      throw new BadRequestException('limit must be between 1 and 500');
    }
    if (offset < 0) {
      this.logger.warn(
        JSON.stringify({ event: 'graphql_invalid_arguments', field: 'makes', offset }),
      );
      throw new BadRequestException('offset must not be negative');
    }

    this.logger.debug(
      JSON.stringify({ event: 'graphql_query_started', field: 'makes', limit, offset }),
    );
    const startedAt = Date.now();
    try {
      const makes = await this.repository.findMakes(limit, offset);
      this.logger.verbose(
        JSON.stringify({
          event: 'graphql_query_completed',
          field: 'makes',
          resultCount: makes.length,
          durationMs: Date.now() - startedAt,
        }),
      );
      return makes;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'graphql_query_failed',
          field: 'makes',
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      throw error;
    }
  }

  @Query(() => VehicleMakeModel, { name: 'make', nullable: true })
  async make(
    @Args('makeId', { type: () => Int }) makeId: number,
  ): Promise<VehicleMakeModel | null> {
    if (!Number.isSafeInteger(makeId) || makeId <= 0) {
      this.logger.warn(
        JSON.stringify({ event: 'graphql_invalid_arguments', field: 'make', makeId }),
      );
      throw new BadRequestException('makeId must be a positive integer');
    }

    this.logger.debug(
      JSON.stringify({ event: 'graphql_query_started', field: 'make', makeId }),
    );
    const startedAt = Date.now();
    try {
      const make = await this.repository.findMake(makeId);
      this.logger.verbose(
        JSON.stringify({
          event: 'graphql_query_completed',
          field: 'make',
          makeId,
          found: make !== null,
          durationMs: Date.now() - startedAt,
        }),
      );
      return make;
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'graphql_query_failed',
          field: 'make',
          makeId,
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
      throw error;
    }
  }
}
