module.exports = {
  // Test environment
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test files patterns
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/app.ts',
    '!src/config/**',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // Clear mocks automatically between tests
  clearMocks: true,
  restoreMocks: true,

  // Timeout for tests (30 seconds)
  testTimeout: 30000,

  // Verbose output
  verbose: true,
};
