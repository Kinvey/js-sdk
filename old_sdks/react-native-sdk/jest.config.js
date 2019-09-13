const config = {
  preset: 'react-native',
  collectCoverage: true,
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.js$': '<rootDir>/node_modules/react-native/jest/preprocessor.js',
    '^.+\\.tsx?$': 'ts-jest'
  },
  globals: {
    'ts-ject': {
      tsConfigFile: 'tsconfig.jest.json'
    }
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  setupFiles: ['<rootDir>/jest/setup.ts'],
  transformIgnorePatterns: ['node_modules/(?!(jest-)?react-native)'],
  coveragePathIgnorePatterns: ['/node_modules/', '/jest', '/demo'],
  testPathIgnorePatterns: ['/node_modules/', '/demo']
};

module.exports = config;
