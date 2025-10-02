module.exports = {
  // JavaScript and TypeScript files
  'src/**/*.{js,ts}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],
  
  // Test files
  'src/tests/**/*.{js,ts}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],
  
  // Configuration files
  '*.{js,ts,json}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],
  
  // Package.json
  'package.json': [
    'npm run lint:package',
    'git add'
  ],
  
  // Documentation files
  'docs/**/*.md': [
    'markdownlint --fix',
    'git add'
  ]
};
