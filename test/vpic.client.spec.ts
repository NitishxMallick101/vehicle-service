import { ConfigService } from '@nestjs/config';
import { VpicClient } from '../src/ingestion/vpic.client';

describe('VpicClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns XML from the upstream API', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('<Response/>', { status: 200 }),
    );
    const client = new VpicClient({
      getOrThrow: (key: string) =>
        ({
          VPIC_BASE_URL: 'https://example.test/api/vehicles',
          VPIC_TIMEOUT_MS: 1000,
          VPIC_RETRIES: 0,
        })[key],
    } as unknown as ConfigService);

    await expect(client.getVehicleTypesXml(440)).resolves.toBe('<Response/>');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.test/api/vehicles/GetVehicleTypesForMakeId/440?format=xml',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('reports network failures after bounded retries', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    const client = new VpicClient({
      getOrThrow: (key: string) =>
        ({
          VPIC_BASE_URL: 'https://example.test/api/vehicles',
          VPIC_TIMEOUT_MS: 1000,
          VPIC_RETRIES: 0,
        })[key],
    } as unknown as ConfigService);

    await expect(client.getAllMakesXml()).rejects.toThrow(
      'vPIC all_makes request failed',
    );
  });
});
