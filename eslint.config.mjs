import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', '.next', 'out', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // Repo ainda está em evolução; reduzir "noise" de lint enquanto a base é estabilizada.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/immutability': 'off',
      'prefer-const': 'warn',
    },
  },
]);
