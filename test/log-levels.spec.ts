import { enabledLogLevels } from '../src/config/log-levels';

describe('enabledLogLevels', () => {
  it.each([
    ['error', ['error']],
    ['warn', ['error', 'warn']],
    ['log', ['error', 'warn', 'log']],
    ['debug', ['error', 'warn', 'log', 'debug']],
    ['verbose', ['error', 'warn', 'log', 'debug', 'verbose']],
    ['invalid', ['error', 'warn', 'log']],
  ])('keeps levels up to %s enabled', (configuredLevel, expected) => {
    expect(enabledLogLevels(configuredLevel)).toEqual(expected);
  });
});
