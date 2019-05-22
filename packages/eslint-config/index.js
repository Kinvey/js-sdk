module.exports = {
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint'
  ],
  parser: '@typescript-eslint/parser',
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
    '@typescript-eslint/explicit-member-accessibility': 'off'
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: [
          '.js',
          '.ts'
        ]
      }
    }
  }
};
