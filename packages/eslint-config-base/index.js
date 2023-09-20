'use strict';

module.exports = {
    env: {
        es6: true,
        browser: true,
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: '2018',
        sourceType: 'module',
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'prettier',
        'plugin:prettier/recommended',
    ],
    plugins: ['prettier', 'import', '@typescript-eslint', 'only-warn'],
    globals: {
        LABKEY: 'readonly',
    },
    rules: {
        // Possible Errors (http://eslint.org/docs/rules/#possible-errors)
        camelcase: 'off',
        'no-array-constructor': 'error',
        'no-tabs': 'error',
        quotes: ['error', 'single', { avoidEscape: true }],
        'eol-last': 'error',
        'semi-spacing': 'error',
        'no-async-promise-executor': 'error',
        'no-await-in-loop': 'warn',
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-constant-condition': ['error', { checkLoops: false }],
        'no-misleading-character-class': 'error',
        'no-prototype-builtins': 'off', // TODO: enable?
        'no-template-curly-in-string': 'error',
        'require-atomic-updates': 'error',

        // Best Practices (http://eslint.org/docs/rules/#best-practices)
        'accessor-pairs': 'warn',
        'array-callback-return': 'error',
        'block-scoped-var': 'error',
        complexity: ['error', 20],
        'consistent-return': 'error',
        'default-case': 'error',
        'dot-notation': 'off',
        eqeqeq: 'error', // CONSIDER: allow == for nulls: ['error', 'always', {'null': 'ignore'}]
        'guard-for-in': 'warn',
        'no-alert': 'error',
        'no-caller': 'error',
        'no-div-regex': 'error',
        'no-empty-function': 'warn',
        'no-eval': 'error',
        'no-extend-native': 'error',
        'no-extra-bind': 'error',
        'no-extra-label': 'error',
        'no-fallthrough': 'error',
        'no-implied-eval': 'error',
        'no-iterator': 'error',
        'no-lone-blocks': 'error',
        'no-loop-func': 'error',
        'no-magic-numbers': 'off', // CONSIDER: maybe warn?
        'no-multi-str': 'error',
        'no-new': 'error',
        'no-new-func': 'error',
        'no-new-wrappers': 'error',
        'no-octal-escape': 'error',
        'no-proto': 'error',
        'no-return-assign': 'error',
        'no-return-await': 'error',
        'no-script-url': 'error',
        'no-self-compare': 'error',
        'no-sequences': 'error',
        'no-throw-literal': 'error',
        'no-unmodified-loop-condition': 'error',
        'no-useless-call': 'error',
        'no-useless-catch': 'error',
        'no-useless-concat': 'error',
        'no-useless-return': 'error',
        'no-void': 'error',
        'no-warning-comments': 'warn',
        'no-with': 'error',
        radix: 'warn',
        'require-await': 'warn',
        'vars-on-top': 'off', // TODO: maybe warn later
        yoda: 'error',

        // Strict Mode (https://eslint.org/docs/rules/#strict-mode)
        // strict: ['error', 'global'], // CONSIDER: add '--alwaysStrict' to tsconfig.json

        // Variables (https://eslint.org/docs/rules/#variables)
        // no-shadow conflicts with typescript no-shadow
        'no-shadow': 'off', // CONSIDER: error?
        '@typescript-eslint/no-shadow': ['warn'],
        'no-label-var': 'error',
        'no-shadow-restricted-names': 'error',
        'no-undef-init': 'error',
        // Conflicts with "@typescript-eslint/no-use-before-define"
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md#how-to-use
        'no-use-before-define': 'off',

        // Stylistic Issues (https://eslint.org/docs/rules/#stylistic-issues)
        'new-cap': [
            'error',
            {
                capIsNewExceptions: ['Record', 'List', 'Map', 'Set', 'OrderedMap', 'OrderedSet'],
            },
        ],
        'no-new-object': 'error',
        'padding-line-between-statements': ['error', { blankLine: 'always', prev: 'directive', next: '*' }],
        'spaced-comment': 'error',

        // ECMAScript 6 (https://eslint.org/docs/rules/#ecmascript-6)
        'arrow-spacing': 'error',
        'no-duplicate-imports': ['error', { includeExports: true }],
        'no-useless-computed-key': 'error',
        'no-useless-constructor': 'error',
        'no-useless-rename': 'error',
        'no-var': 'off', // too soon for enabling this globally
        'object-shorthand': ['error', 'properties'],
        'prefer-const': 'warn',
        'prefer-numeric-literals': 'error',
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'symbol-description': 'error',

        // Prettier plugin (https://github.com/prettier/eslint-plugin-prettier)
        // https://github.com/prettier/eslint-config-prettier
        'prettier/prettier': ['error', require('./.prettierrc.json'), { usePrettierrc: false }],

        // Typescript
        // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin
        '@typescript-eslint/explicit-function-return-type': [
            'warn',
            {
                allowExpressions: true,
                allowTypedFunctionExpressions: true,
            },
        ],
        '@typescript-eslint/no-use-before-define': [
            'error',
            {
                functions: false,
                classes: false,
            },
        ],
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/array-type': [
            'error',
            {
                default: 'array-simple',
            },
        ],
        // see: https://github.com/Microsoft/TypeScript/commit/b8f22f51441495203c96b95969c45a3f78482517#diff-66cec844e251a1918deb897eabca206bR2765
        '@typescript-eslint/ban-types': [
            'error',
            {
                types: {
                    Function: {
                        message: 'Use a specific function type, like `() => void`, or use `ts.AnyFunction`.',
                    },
                },
            },
        ],
        '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/member-ordering': 'warn',

        // Import plugin (https://github.com/benmosher/eslint-plugin-import)

        // Static analysis
        'import/no-unresolved': 'error',
        'import/named': 'error',
        'import/default': 'warn',
        'import/namespace': 'error',
        'import/no-restricted-path': 'off',
        'import/no-absolute-path': 'error',
        'import/no-dynamic-require': 'warn',
        'import/no-internal-modules': 'off',
        'import/no-webpack-loader-syntax': 'error',
        'import/no-self-import': 'error',
        'import/no-cycle': 'warn',
        'import/no-useless-path-segments': 'error',
        'import/no-relative-parent-imports': 'off',

        // Helpful warnings
        'import/export': 'error',
        'import/no-named-as-default': 'error',
        'import/no-named-as-default-member': 'error',
        'import/no-deprecated': 'warn',
        // CONSIDER: enable once we get @labkey/depdendencies sorted out
        'import/no-extraneous-dependencies': 'off',
        'import/no-mutable-exports': 'warn',

        // Module systems
        'import/unambiguous': 'warn',
        'import/no-commonjs': 'off',
        'import/no-amd': 'error',
        'import/no-nodejs-modules': 'off',

        // Style guide
        'import/first': 'error',
        'import/exports-last': 'off',
        'import/no-duplicates': 'error',
        'import/no-namespace': 'off',
        'import/extensions': 'off',
        'import/order': [
            'warn',
            {
                groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                'newlines-between': 'always-and-inside-groups',
            },
        ],
        'import/newline-after-import': 'error',
        'import/prefer-default-export': 'off',
        'import/max-dependencies': 'off',
        'import/no-unassigned-import': ['warn', { allow: ['make-promises-safe', 'node-report'] }],
        'import/no-named-default': 'warn',
        'import/no-default-export': 'off',
        'import/no-anonymous-default-export': 'warn',
        'import/group-exports': 'off',
        'import/dynamic-import-chunkname': 'off',
    },
};
