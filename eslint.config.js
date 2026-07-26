import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
    globalIgnores(['**/dist', '**/node_modules', '**/vite.config*.js']),
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        extends: [
            js.configs.recommended,
            react.configs.flat.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
            prettierConfig,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/jsx-no-target-blank': 'off',
            'react/jsx-props-no-spreading': 'off',
            'react/no-array-index-key': 'warn',
            'react/prop-types': 'off',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            'no-console': ['warn', { allow: ['debug', 'error'] }],
            'no-unused-expressions': ['error', { allowTernary: true }],
            camelcase: 'off',
            'import/no-unresolved': ['error', { caseSensitive: true }],
        },
        plugins: {
            import: importPlugin,
        },
        settings: {
            react: {
                version: 'detect',
            },
            'import/extensions': ['.js', '.jsx'],
            'import/resolver': {
                node: { extensions: ['.js', '.jsx'] },
            },
        },
    },
]);
