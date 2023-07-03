module.exports = {
  collectCoverage: true,
  transform: {
    '^.+\\.(js|jsx)?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules\\/(?!(lodash-es)\\/)'],
  testMatch: ['<rootDir>/test/*.spec.ts'],
};
