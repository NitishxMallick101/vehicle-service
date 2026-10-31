import { LogLevel } from '@nestjs/common';

const levels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];

export function enabledLogLevels(configuredLevel: string): LogLevel[] {
  const index = levels.indexOf(configuredLevel as LogLevel);
  return levels.slice(0, index < 0 ? 3 : index + 1);
}
