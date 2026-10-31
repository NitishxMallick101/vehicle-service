import 'reflect-metadata';
import { ConsoleLogger, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IngestionService } from './ingestion/ingestion.service';
import { enabledLogLevels } from './config/log-levels';

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: new ConsoleLogger({
      json: true,
      logLevels: enabledLogLevels(process.env.LOG_LEVEL ?? 'log'),
    }),
  });
  try {
    const logLevel = app.get(ConfigService).getOrThrow<string>('LOG_LEVEL');
    app.useLogger(
      new ConsoleLogger({
        json: true,
        logLevels: enabledLogLevels(logLevel),
      }),
    );
    const count = await app.get(IngestionService).ingest();
    new Logger('IngestionCommand').log(
      JSON.stringify({ event: 'ingestion_command_succeeded', makeCount: count }),
    );
  } finally {
    await app.close();
  }
}

void run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(JSON.stringify({ event: 'ingestion_command_failed', error: message }));
  process.exitCode = 1;
});
