module.exports = {
  extends: [
    'airbnb-base',
    'plugin:jest/recommended',
    'kinvey-platform',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],
  plugins: [
    'jest',
    '@typescript-eslint',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  rules: {
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'max-classes-per-file': 'off',
    'no-dupe-class-members': 'off',
    'no-useless-constructor': 'off',

    // Import
    'import/extensions': [
      'error',
      {
        '.js': 'never',
        '.jsx': 'never',
        '.ts': 'always',
        '.tsx': 'never'
      }
    ],
    'import/prefer-default-export': 'off',

    // TypeScript
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-useless-constructor': 'error',
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: [
          '.js',
          '.jsx',
          '.json',
          '.ts',
          '.tsx',
        ]
      }
    },
    'import/extensions': [
      '.js',
      '.jsx',
      '.json',
      '.ts',
      '.tsx'
    ],
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.test.ts'],
      rules: {
        'spaced-comment': 'off',
        'func-names': 'off',
        'no-undef': 'off',
        'no-unused-expressions': 'off',

        // Import
        'import/no-extraneous-dependencies': 'off',

        // TypeScript
        '@typescript-eslint/ban-ts-ignore': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
      env: {
        jest: true,
      }
    },
    {
      files: ['**/*.jest.js', '**/*.jest.ts'],
      rules: {
        // Import
        'import/no-extraneous-dependencies': 'off',

        // TypeScript
        '@typescript-eslint/no-var-requires': 'off',
      }
    }
  ]
};
