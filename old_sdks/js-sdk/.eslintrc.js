module.exports = {
  extends: [
    'airbnb-base',
    'kinvey-platform',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  rules: {
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],

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
    'import/prefer-default-export': 'warn',

    // TypeScript
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
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
      files: ['src/**/*.test.ts'],
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
      },
    }
  ]
};
