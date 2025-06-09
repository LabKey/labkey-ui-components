import importPlugin from 'eslint-plugin-import';
import perfectionist from 'eslint-plugin-perfectionist';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import typeScriptESLint from 'typescript-eslint';

export default defineConfig([
    globalIgnores([
        '**/dist/**',
        '**/__mocks__/**',
        '**/node_modules/**',
        '**/*.config.js',
        '**/*.d.ts',
        '**/*.mjs',
        '**/*.spec.ts',
        '**/*.spec.tsx',
    ]),
    typeScriptESLint.configs.recommended,
    typeScriptESLint.configs.stylistic,
    pluginReact.configs.flat.recommended,
    pluginReactHooks.configs['recommended-latest'],
    perfectionist.configs['recommended-natural'],
    {
        files: ['src/**/*.{ts,tsx}'],
        extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
        languageOptions: { globals: globals.browser },
        rules: {
            '@typescript-eslint/array-type': 'warn',
            '@typescript-eslint/consistent-generic-constructors': 'warn',
            '@typescript-eslint/consistent-indexed-object-style': 'warn',
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/no-empty-function': 'warn',
            '@typescript-eslint/no-empty-object-type': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-inferrable-types': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/prefer-for-of': 'warn',
            'import/no-cycle': 'warn',
            'no-var': 'warn',
            'perfectionist/sort-array-includes': 'off',
            'perfectionist/sort-classes': 'off',
            'perfectionist/sort-enums': 'warn',
            'perfectionist/sort-exports': 'warn',
            'perfectionist/sort-heritage-clauses': 'warn',
            'perfectionist/sort-imports': 'off',
            'perfectionist/sort-interfaces': 'warn',
            'perfectionist/sort-intersection-types': 'warn',
            'perfectionist/sort-jsx-props': 'warn',
            'perfectionist/sort-modules': 'off',
            'perfectionist/sort-named-exports': 'warn',
            'perfectionist/sort-named-imports': 'warn',
            'perfectionist/sort-objects': 'off',
            'perfectionist/sort-sets': 'warn',
            'perfectionist/sort-switch-case': 'warn',
            'perfectionist/sort-union-types': 'warn',
            'perfectionist/sort-variable-declarations': 'warn',
            'prefer-const': 'warn',
            'react/display-name': 'warn',
            'react/no-unescaped-entities': 'off',
            'react/prop-types': 'off',
        },
    },
]);
