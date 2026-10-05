import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const config = [
  { ignores: ['.next/**', 'demo/**', 'next.config.mjs'] },
  ...nextVitals,
  ...nextTs,
  prettierRecommended,
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'react/no-unescaped-entities': 'off',
      // ponytail: React Compiler rules new in Next 16; warn until components are refactored
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/set-state-in-render': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];

export default config;
