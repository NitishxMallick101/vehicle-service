import * as Joi from 'joi';

export const DEFAULT_DATABASE_URL =
  'postgres://postgres:postgres@localhost:5432/vehicle_service';

export const configurationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'log', 'debug', 'verbose')
    .default('log'),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .default(DEFAULT_DATABASE_URL),
  DATABASE_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
  DATABASE_POOL_SIZE: Joi.number().integer().min(1).max(100).default(10),
  VPIC_BASE_URL: Joi.string().uri({ scheme: ['http', 'https'] })
    .default('https://vpic.nhtsa.dot.gov/api/vehicles'),
  VPIC_TIMEOUT_MS: Joi.number().integer().min(1000).max(120000).default(20000),
  VPIC_RETRIES: Joi.number().integer().min(0).max(5).default(2),
  VPIC_CONCURRENCY: Joi.number().integer().min(1).max(32).default(8),
});
