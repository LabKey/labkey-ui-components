import importPlugin from 'eslint-plugin-import'; // TODO: Use "eslint-plugin-import-x" instead
import perfectionist from 'eslint-plugin-perfectionist';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import typeScriptESLint from 'typescript-eslint';

export default defineConfig([
    typeScriptESLint.configs.recommended,
    typeScriptESLint.configs.stylistic,
    pluginReact.configs.flat.recommended,
    pluginReactHooks.configs['recommended-latest'],
    perfectionist.configs["recommended-natural"],
    {
        files: ['src/**/*.{ts,tsx}'],
        extends: [importPlugin.flatConfigs.recommended, importPlugin.flatConfigs.typescript],
        languageOptions: { globals: globals.browser },
        rules: {
            '@typescript-eslint/array-type': 'warn',
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/no-empty-function': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            'import/no-cycle': 'warn',
            'perfectionist/sort-classes': 'off',
            'perfectionist/sort-heritage-clauses': 'warn',
            'perfectionist/sort-imports': 'off',
            'perfectionist/sort-interfaces': 'warn',
            'perfectionist/sort-intersection-types': 'warn',
            'perfectionist/sort-jsx-props': 'warn',
            'perfectionist/sort-modules': 'off',
            'perfectionist/sort-named-imports': 'warn',
            'perfectionist/sort-objects': 'off',
            'perfectionist/sort-switch-case': 'warn',
            'perfectionist/sort-union-types': 'warn',
            'react/display-name': 'warn',
            'react/prop-types': 'off',
        },
    },
]);
