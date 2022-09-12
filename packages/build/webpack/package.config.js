/*
 * Copyright (c) 2016-2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const constants = require('./constants');
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const IgnorePlugin = require('webpack').IgnorePlugin;
const CircularDependencyPlugin = require('circular-dependency-plugin')

const tsCheckerConfig = {
    ...constants.TS_CHECKER_CONFIG,
    typescript: {
        ...constants.TS_CHECKER_CONFIG.typescript,
        mode: "write-dts",
        configOverwrite: {
            compilerOptions: { outDir: 'dist/' },
            include: ["src/**/*"],
            // excluding spec files shaves time off the build
            exclude: ["node_modules", "**/*.spec.*", "src/test"]
        }
    }
};

const BABEL_CONFIG = {
    loader: 'babel-loader',
    options: {
        babelrc: false,
        cacheDirectory: true,
        presets: [
            [
                '@babel/preset-env',
                {
                    // support async/await
                    targets: 'last 2 versions, not dead, not IE 11, > 5%',
                    modules: false,
                }
            ],
        ],
        plugins: constants.BABEL_PLUGINS,
    }
};

module.exports = {
    entry: './src/index.ts',
    target: 'web',
    mode: 'production',
    experiments: {
        outputModule: true,
    },
    module: {
        rules: [
            {
                test: /^(?!.*spec\.tsx?$).*\.tsx?$/,
                use: [BABEL_CONFIG],
            }
        ],
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
            type: 'module'
        },
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin(tsCheckerConfig),
        new CopyWebpackPlugin({
            patterns: [
                {
                    // copy theme scss files into the dist dir to be used by LabKey module apps
                    from: 'src/theme',
                    to: 'assets/scss/theme'
                }
            ]
        }),
        new IgnorePlugin({
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
        }),
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            include: /src/,
            failOnError: true,
        }),
    ],
    externals: [
        // Note: If there is a package (of our own, or 3rd party) that is a dependency of one of our packages AND one of
        // our apps, then it should be in the list of externals.
        '@atlaskit/tree',
        '@fortawesome/fontawesome-free',
        '@fortawesome/fontawesome-svg-core',
        '@fortawesome/free-regular-svg-icons',
        '@fortawesome/free-solid-svg-icons',
        '@fortawesome/react-fontawesome',
        '@labkey/api',
        '@labkey/components',
        '@remirror/pm',
        'boostrap-sass',
        'classnames',
        'date-fns',
        'enzyme',
        'enzyme-adapter-react-16',
        'enzyme-to-json',
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
        'moment',
        'moment-timezone',
        'numeral',
        'prosemirror',
        'react',
        'react-beautiful-dnd',
        'react-bootstrap',
        'react-bootstrap-toggle',
        'react-color',
        'react-datepicker',
        'react-dom',
        'react-dom/test-utils',
        'react-redux',
        'react-router',
        'react-select',
        'react-select/async',
        'react-select/async-creatable',
        'react-select/creatable',
        'react-sticky',
        'react-test-renderer',
        'react-treebeard',
        'redux',
        'redux-actions',
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
        'xhr-mock',
    ]
};
