import { ConfigService } from '@nestjs/config';
import { IngestionService } from '../src/ingestion/ingestion.service';
import { VehicleDataTransformer } from '../src/ingestion/vehicle-data.transformer';
import { VehicleRepository } from '../src/ingestion/vehicle.repository';
import { VehicleXmlParser } from '../src/ingestion/vehicle-xml.parser';
import { VpicClient } from '../src/ingestion/vpic.client';

describe('IngestionService', () => {
  const make = { makeId: 440, makeName: 'Ford' };
  const type = { typeId: 2, typeName: 'Passenger Car' };
  let client: jest.Mocked<Pick<VpicClient, 'getAllMakesXml' | 'getVehicleTypesXml'>>;
  let parser: jest.Mocked<Pick<VehicleXmlParser, 'parseMakes' | 'parseVehicleTypes'>>;
  let transformer: jest.Mocked<Pick<VehicleDataTransformer, 'unify'>>;
  let repository: jest.Mocked<Pick<VehicleRepository, 'replaceAll'>>;
  let service: IngestionService;

  beforeEach(() => {
    client = {
      getAllMakesXml: jest.fn().mockResolvedValue('<makes/>'),
      getVehicleTypesXml: jest.fn().mockResolvedValue('<types/>'),
    };
    parser = {
      parseMakes: jest.fn().mockReturnValue([make]),
      parseVehicleTypes: jest.fn().mockReturnValue([type]),
    };
    transformer = {
      unify: jest.fn().mockReturnValue([{ ...make, vehicleTypes: [type] }]),
    };
    repository = { replaceAll: jest.fn().mockResolvedValue(undefined) };
    service = new IngestionService(
      client as unknown as VpicClient,
      parser as unknown as VehicleXmlParser,
      transformer as unknown as VehicleDataTransformer,
      repository as unknown as VehicleRepository,
      { getOrThrow: () => 2 } as unknown as ConfigService,
    );
  });

  it('fetches, transforms, persists, and returns the make count', async () => {
    await expect(service.ingest()).resolves.toBe(1);
    expect(client.getVehicleTypesXml).toHaveBeenCalledWith(440);
    expect(transformer.unify).toHaveBeenCalledWith([make], new Map([[440, [type]]]));
    expect(repository.replaceAll).toHaveBeenCalledWith([
      { ...make, vehicleTypes: [type] },
    ]);
  });

  it('surfaces external, transformation, and persistence failures', async () => {
    client.getAllMakesXml.mockRejectedValueOnce(new Error('network unavailable'));
    await expect(service.ingest()).rejects.toThrow('network unavailable');

    parser.parseMakes.mockReturnValueOnce([make]);
    transformer.unify.mockImplementationOnce(() => {
      throw new Error('invalid transformation');
    });
    await expect(service.ingest()).rejects.toThrow('invalid transformation');

    repository.replaceAll.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(service.ingest()).rejects.toThrow('database unavailable');
  });
});
