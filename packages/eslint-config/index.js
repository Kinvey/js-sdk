module.exports = {
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    'lines-between-class-members': 'off',
    'no-dupe-class-members': 'off',
    'semi': 'error',

    // Import
    'import/prefer-default-export': 'off',

    // Typescript
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    // Prettier
    'prettier/prettier': ['error', { 'singleQuote': true }]
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: [
          '.js',
          '.ts',
          '.tsx'
        ]
      }
    }
  }
};
