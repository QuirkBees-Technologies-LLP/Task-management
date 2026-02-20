/**
 * @type {import('eslint').ESLint.ConfigData}
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'unused-imports', 'react', 'react-hooks', 'prettier'],
  rules: {
    // 💬 General
    'no-console': 'off', // allow console logs
    'no-alert': 'off', // allow alert()
    'no-debugger': 'warn', // warn instead of error

    // 🧠 TypeScript
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // only warn
    '@typescript-eslint/no-explicit-any': 'off', // allow `any`
    '@typescript-eslint/explicit-function-return-type': 'off', // no need to always specify return types
    '@typescript-eslint/no-non-null-assertion': 'off', // allow !
    '@typescript-eslint/ban-ts-comment': 'off', // allow // @ts-ignore
    '@typescript-eslint/no-empty-function': 'off', // allow empty functions

    // ⚛️ React
    'react/react-in-jsx-scope': 'off', // Next.js already includes React
    'react/prop-types': 'off', // not needed with TypeScript
    'react/jsx-props-no-spreading': 'off', // allow prop spreading
    'react/no-unescaped-entities': 'off', // allow unescaped chars in JSX
    'react/display-name': 'off', // don’t require display names
    'react-hooks/exhaustive-deps': 'warn', // only warn about missing deps

    // 📦 Imports
    'import/prefer-default-export': 'off',
    'import/extensions': 'off',
    'import/no-extraneous-dependencies': 'off',

    // ⚙️ Misc
    'no-multiple-empty-lines': ['warn', { max: 2 }],
    'no-trailing-spaces': ['warn'],
    '@typescript-eslint/no-require-imports': 'off',
  },
};
