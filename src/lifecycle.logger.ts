import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class LifecycleLogger implements OnApplicationShutdown {
  private readonly logger = new Logger(LifecycleLogger.name);

  onApplicationShutdown(signal?: string): void {
    this.logger.log(
      JSON.stringify({ event: 'application_shutdown', signal }),
    );
  }
}
