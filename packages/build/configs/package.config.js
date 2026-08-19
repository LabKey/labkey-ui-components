/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
const path = require('path');
const { rspack } = require('@rspack/core');
const constants = require('./constants');
const { TsCheckerRspackPlugin } = require('ts-checker-rspack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const tsCheckerConfig = {
    ...constants.TS_CHECKER_CONFIG,
    typescript: {
        ...constants.TS_CHECKER_CONFIG.typescript,
        mode: 'write-dts',
        configOverwrite: {
            compilerOptions: { outDir: 'dist/' },
            include: ['src/**/*'],
            // excluding spec/test files shaves time off the build
            exclude: ['node_modules', '**/__mocks__/**/*', '**/*.spec.*', '**/*.test.*', 'src/test']
        }
    }
};

const plugins = [
    new TsCheckerRspackPlugin(tsCheckerConfig),
    new rspack.CopyRspackPlugin({
        patterns: [
            {
                // copy theme scss files into the dist dir to be used by LabKey module apps
                from: 'src/theme',
                to: 'assets/scss/theme'
            }
        ]
    }),
];
if (process.env.ANALYZE) {
    plugins.push(new BundleAnalyzerPlugin());
}

module.exports = {
    entry: './src/index.ts',
    ignoreWarnings: constants.ignoreWarnings,
    devtool: 'source-map',
    target: 'web',
    mode: 'production',
    module: {
        rules: constants.loaders.TYPESCRIPT,
    },
    resolve: {
        extensions: [ '.jsx', '.js', '.tsx', '.ts' ]
    },
    optimization: {
        // don't minimize the code from packages, the code will get minimized during app builds
        minimize: false
    },
    output: {
        path: path.resolve('./dist'),
        publicPath: '',
        filename: constants.lkModule + '.js',
        library: {
            name: '@labkey/' + constants.lkModule,
            type: 'umd'
        },
    },
    plugins,
    externals: [
        // Note: If there is a package (of our own, or 3rd party) that is a dependency of one of our packages AND one of
        // our apps, then it should be in the list of externals.
        '@atlaskit/tree',
        '@hello-pangea/dnd',
        '@labkey/api',
        '@labkey/components',
        '@labkey/premium',
        '@remirror/pm',
        '@remix-run/router',
        '@testing-library/jest-dom',
        '@testing-library/react',
        '@testing-library/user-event',
        'classnames',
        'date-fns',
        'date-fns/format',
        'date-fns-tz',
        'execa',
        'font-awesome',
        'formsy-react',
        'formsy-react-components',
        'history',
        'immutable',
        'immer',
        'jest',
        'jest-cli',
        'jest-environment-jsdom',
        'jquery',
        'lodash',
        'normalizr',
        'numeral',
        'prosemirror',
        'react',
        'react-color',
        'react-datepicker',
        'react-dom',
        'react-dom/test-utils',
        'react-redux',
        'react-router',
        'react-router/dom',
        'react-select',
        'react-select/async',
        'react-select/async-creatable',
        'react-select/creatable',
        'react-test-renderer',
        'react-treebeard',
        'redux',
        'remirror',
        '@remirror',
        '@remirror/core',
        '@remirror/core-types',
        '@remirror/pm/state',
        '@remirror/react',
        '@remirror/pm/suggest',
        'remirror/extensions',
        '@remirror/pm/tables',
        'ts-jest',
        'use-immer',
        'vis-network',
    ]
};
