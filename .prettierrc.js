module.exports = {
  // Basic formatting
  semi: true,
  trailingComma: 'none',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  
  // Bracket formatting
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // Line endings
  endOfLine: 'lf',
  
  // Quote props
  quoteProps: 'as-needed',
  
  // JSX (for future React components)
  jsxSingleQuote: true,
  
  // Prose wrap
  proseWrap: 'preserve',
  
  // HTML whitespace
  htmlWhitespaceSensitivity: 'css',
  
  // Vue files
  vueIndentScriptAndStyle: false,
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2
      }
    }
  ]
};
