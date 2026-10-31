import { BadRequestException, Logger } from '@nestjs/common';
import { VehicleRepository } from '../src/ingestion/vehicle.repository';
import { VehicleResolver } from '../src/graphql/vehicle.resolver';

describe('VehicleResolver logging', () => {
  let resolver: VehicleResolver;
  let findMakes: jest.Mock;
  let findMake: jest.Mock;

  beforeEach(() => {
    findMakes = jest.fn().mockResolvedValue([]);
    findMake = jest.fn().mockResolvedValue(null);
    resolver = new VehicleResolver({
      findMakes,
      findMake,
    } as unknown as VehicleRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs GraphQL query start and completion without logging result payloads', async () => {
    const debug = jest.spyOn(Logger.prototype, 'debug').mockImplementation();
    const verbose = jest.spyOn(Logger.prototype, 'verbose').mockImplementation();

    await expect(resolver.makes(25, 50)).resolves.toEqual([]);

    expect(findMakes).toHaveBeenCalledWith(25, 50);
    expect(debug.mock.calls[0][0]).toContain('"event":"graphql_query_started"');
    expect(verbose.mock.calls[0][0]).toContain('"event":"graphql_query_completed"');
    expect(verbose.mock.calls[0][0]).toContain('"resultCount":0');
  });

  it('warns when query arguments are invalid', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await expect(resolver.makes(501, 0)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(warn.mock.calls[0][0]).toContain('"event":"graphql_invalid_arguments"');
    expect(findMakes).not.toHaveBeenCalled();
  });
});
