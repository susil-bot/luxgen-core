module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Only basic rules that definitely exist
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-undef': 'warn',
    'no-unreachable': 'warn',
    'no-constant-condition': 'warn',
    'no-empty': 'warn',
    'no-extra-semi': 'warn',
    'no-irregular-whitespace': 'warn',
    'no-redeclare': 'warn',
    'no-sparse-arrays': 'warn',
    'no-unexpected-multiline': 'warn',
    'use-isnan': 'warn',
    'valid-typeof': 'warn',
  },
  globals: {
    process: 'readonly',
    Buffer: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    global: 'readonly',
    console: 'readonly',
    module: 'readonly',
    require: 'readonly',
    exports: 'readonly',
  },
};
