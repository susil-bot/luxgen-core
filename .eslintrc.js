/**
 * ESLint Configuration
 * Code quality and style enforcement
 */

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  
  extends: [
    'eslint:recommended'
  ],
  
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  
  rules: {
    // Error handling
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // Variables
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-undef': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    
    // Functions
    'no-empty-function': 'warn',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    
    // Objects and arrays
    'object-shorthand': 'error',
    'prefer-destructuring': ['error', {
      array: true,
      object: true
    }],
    'no-array-constructor': 'error',
    
    // Strings
    'prefer-template': 'error',
    'template-curly-spacing': 'error',
    'no-useless-concat': 'error',
    
    // Control flow
    'no-else-return': 'error',
    'no-nested-ternary': 'warn',
    
    // Async
    'no-async-promise-executor': 'error',
    'require-await': 'warn',
    'no-promise-executor-return': 'error',
    
    // Security
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Code style
    'indent': ['error', 2, {
      SwitchCase: 1,
      VariableDeclarator: 1,
      outerIIFEBody: 1,
      MemberExpression: 1,
      FunctionDeclaration: { parameters: 1, body: 1 },
      FunctionExpression: { parameters: 1, body: 1 },
      CallExpression: { arguments: 1 },
      ArrayExpression: 1,
      ObjectExpression: 1,
      ImportDeclaration: 1,
      flatTernaryExpressions: false,
      ignoreComments: false,
      ignoredNodes: ['JSXElement', 'JSXElement > *', 'JSXAttribute', 'JSXIdentifier', 'JSXNamespacedName', 'JSXMemberExpression', 'JSXSpreadAttribute', 'JSXExpressionContainer', 'JSXOpeningElement', 'JSXClosingElement', 'JSXFragment', 'JSXOpeningFragment', 'JSXClosingFragment', 'JSXText', 'JSXEmptyExpression', 'JSXSpreadChild']
    }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'comma-spacing': 'error',
    'comma-style': 'error',
    'key-spacing': 'error',
    'keyword-spacing': 'error',
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    'space-in-parens': ['error', 'never'],
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': ['error', 'always'],
    'eol-last': 'error',
    'no-trailing-spaces': 'error',
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    'padded-blocks': ['error', 'never'],
    'no-mixed-spaces-and-tabs': 'error',
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'camelcase': ['error', { properties: 'never' }],
    'consistent-this': ['error', 'self'],
    'func-call-spacing': 'error',
    'func-name-matching': 'error',
    'func-names': 'warn',
    'func-style': ['error', 'expression'],
    'id-blacklist': 'off',
    'id-length': 'off',
    'id-match': 'off',
    'max-depth': ['error', 4],
    'max-len': ['error', {
      code: 100,
      tabWidth: 2,
      ignoreUrls: true,
      ignoreComments: false,
      ignoreRegExpLiterals: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true
    }],
    'max-lines': ['error', {
      max: 300,
      skipBlankLines: true,
      skipComments: true
    }],
    'max-lines-per-function': ['error', {
      max: 50,
      skipBlankLines: true,
      skipComments: true,
      IIFEs: true
    }],
    'max-nested-callbacks': ['error', 3],
    'max-params': ['error', 4],
    'max-statements': ['error', 20],
    'max-statements-per-line': ['error', { max: 1 }],
    'new-cap': 'error',
    'new-parens': 'error',
    'no-array-constructor': 'error',
    'no-bitwise': 'error',
    'no-continue': 'error',
    'no-inline-comments': 'error',
    'no-lonely-if': 'error',
    'no-mixed-operators': 'error',
    'no-negated-condition': 'error',
    'no-nested-ternary': 'error',
    'no-new-object': 'error',
    'no-plusplus': 'error',
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement'
    ],
    'no-tabs': 'error',
    'no-ternary': 'off',
    'no-underscore-dangle': 'off',
    'no-unneeded-ternary': 'error',
    'no-whitespace-before-property': 'error',
    'nonblock-statement-body-position': 'error',
    'object-curly-newline': ['error', {
      ObjectExpression: { multiline: true, minProperties: 3 },
      ObjectPattern: { multiline: true },
      ImportDeclaration: { multiline: true, minProperties: 3 },
      ExportDeclaration: { multiline: true, minProperties: 3 }
    }],
    'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    'one-var': ['error', 'never'],
    'one-var-declaration-per-line': 'error',
    'operator-assignment': 'error',
    'operator-linebreak': 'error',
    'prefer-object-spread': 'error',
    'quote-props': ['error', 'as-needed'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': 'error',
    'semi-spacing': 'error',
    'semi-style': 'error',
    'sort-keys': 'off',
    'sort-vars': 'off',
    'space-before-blocks': 'error',
    'space-before-function-paren': 'error',
    'space-in-parens': 'error',
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': 'error',
    'switch-colon-spacing': 'error',
    'template-tag-spacing': 'error',
    'unicode-bom': 'error',
    'wrap-regex': 'error'
  },
  
  overrides: [
    {
      files: ['src/tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off',
        'max-lines': 'off',
        'max-lines-per-function': 'off'
      }
    },
    {
      files: ['src/scripts/**/*.js'],
      rules: {
        'no-console': 'off'
      }
    }
  ],
  
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'dist/',
    'build/',
    '*.min.js'
  ]
}; 