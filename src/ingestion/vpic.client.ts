import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VpicClient {
  private readonly logger = new Logger(VpicClient.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retries: number;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('VPIC_BASE_URL').replace(/\/+$/, '');
    this.timeoutMs = Number(config.getOrThrow<string>('VPIC_TIMEOUT_MS'));
    this.retries = Number(config.getOrThrow<string>('VPIC_RETRIES'));
  }

  getAllMakesXml(): Promise<string> {
    return this.getXml('/getallmakes?format=XML', 'all_makes');
  }

  getVehicleTypesXml(makeId: number): Promise<string> {
    return this.getXml(
      `/GetVehicleTypesForMakeId/${makeId}?format=xml`,
      'vehicle_types',
      makeId,
    );
  }

  private async getXml(
    path: string,
    operation: string,
    makeId?: number,
  ): Promise<string> {
    const url = `${this.baseUrl}${path}`;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        this.logger.debug(
          JSON.stringify({
            event: 'vpic_request_started',
            operation,
            makeId,
            attempt: attempt + 1,
          }),
        );
        const response = await fetch(url, {
          headers: { accept: 'application/xml, text/xml' },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!response.ok) {
          const retryable = response.status === 429 || response.status >= 500;
          if (!retryable || attempt === this.retries) {
            throw new Error(`vPIC returned HTTP ${response.status}`);
          }
          this.logRetry(operation, makeId, attempt + 1, response.status);
          await this.wait(250 * 2 ** attempt);
          continue;
        }
        this.logger.verbose(
          JSON.stringify({
            event: 'vpic_request_succeeded',
            operation,
            makeId,
            attempt: attempt + 1,
            status: response.status,
          }),
        );
        return await response.text();
      } catch (error) {
        const isFinalAttempt = attempt === this.retries;
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (isFinalAttempt || message.startsWith('vPIC returned HTTP 4')) {
          this.logger.error(
            JSON.stringify({
              event: 'vpic_request_failed',
              operation,
              makeId,
              attempt: attempt + 1,
              error: message,
            }),
          );
          throw new Error(`vPIC ${operation} request failed`, { cause: error });
        }
        this.logRetry(operation, makeId, attempt + 1);
        await this.wait(250 * 2 ** attempt);
      }
    }
    throw new Error(`vPIC ${operation} request failed`);
  }

  private logRetry(
    operation: string,
    makeId: number | undefined,
    attempt: number,
    status?: number,
  ): void {
    this.logger.warn(
      JSON.stringify({
        event: 'vpic_request_retry',
        operation,
        makeId,
        attempt,
        status,
      }),
    );
  }

  private wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
