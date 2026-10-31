import 'reflect-metadata';
import dataSource from './database/data-source';

async function migrate(): Promise<void> {
  await dataSource.initialize();
  try {
    const migrations = await dataSource.runMigrations();
    console.log(JSON.stringify({ event: 'migrations_completed', count: migrations.length }));
  } finally {
    await dataSource.destroy();
  }
}

void migrate().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(JSON.stringify({ event: 'migration_failed', error: message }));
  process.exitCode = 1;
});
