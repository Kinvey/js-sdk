const config = {
  clearMocks: true,
  collectCoverageFrom: ['**/src/**/*.{ts,tsx}', '!**/src/**/index.ts', '!**/node_modules/**', '!**/vendor/**'],
  preset: 'ts-jest',
  roots: ['<rootDir>/packages', '<rootDir>/sdks'],
  setupFiles: ['<rootDir>/setup-env.jest.js'],
  setupFilesAfterEnv: [
    '<rootDir>/packages/log/silence-logger.jest.ts',
    '<rootDir>/setup-timeout.jest.js',
    '<rootDir>/setup-nock.jest.js',
  ],
};

module.exports = config;
