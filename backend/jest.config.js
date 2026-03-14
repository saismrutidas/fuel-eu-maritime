/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  collectCoverageFrom: ['src/**/*.ts'],
  // Run integration tests sequentially to avoid DB contention
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      moduleNameMapper: {
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
        '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
      },
    },
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      moduleNameMapper: {
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@adapters/(.*)$': '<rootDir>/src/adapters/$1',
        '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
      },
    },
  ],
};

module.exports = config;
