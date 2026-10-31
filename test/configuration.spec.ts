import {
  configurationSchema,
  DEFAULT_DATABASE_URL,
} from '../src/config/configuration';

describe('configurationSchema', () => {
  it('defaults the database URL to local PostgreSQL', () => {
    const { error, value } = configurationSchema.validate({});

    expect(error).toBeUndefined();
    expect(value.DATABASE_URL).toBe(DEFAULT_DATABASE_URL);
  });

  it('preserves a Docker or externally supplied database URL', () => {
    const databaseUrl =
      'postgres://postgres:postgres@db:5432/vehicle_service';
    const { error, value } = configurationSchema.validate({
      DATABASE_URL: databaseUrl,
    });

    expect(error).toBeUndefined();
    expect(value.DATABASE_URL).toBe(databaseUrl);
  });

  it('parses database SSL as a boolean', () => {
    const { error, value } = configurationSchema.validate({
      DATABASE_SSL: 'true',
    });

    expect(error).toBeUndefined();
    expect(value.DATABASE_SSL).toBe(true);
  });
});
