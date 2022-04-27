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

const tsCheckerConfig = {
    ...constants.TS_CHECKER_CONFIG,
    typescript: {
        ...constants.TS_CHECKER_CONFIG.typescript,
        mode: "write-dts",
        configOverwrite: {
            compilerOptions: { outDir: 'dist/' },
            include: ["src/**/*"],
            // excluding spec files shaves time off the build
            exclude: ["node_modules", "**/*.spec.*", "src/test/**/*"]
        }
    }
};

module.exports = {
    entry: './src/index.ts',
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
    ],
    externals: [
        // Note: If there is a package (of our own, or 3rd party) that is a dependency of one of our packages AND one of
        // our apps, then it should be in the list of externals.
        '@labkey/api',
        '@labkey/components',
        'date-fns',
        'font-awesome',
        'formsy-react',
        'formsy-react-components',
        'history',
        'immutable',
        'jquery',
        'lodash',
        'moment',
        'moment-jdateformatparser',
        'moment-timezone',
        'numeral',
        'react',
        'reactn',
        'react-beautiful-dnd',
        'react-bootstrap',
        'react-bootstrap-toggle',
        'react-datepicker',
        'react-dom',
        'react-redux',
        'react-router',
        'react-treebeard',
        'redux-actions',
        'xhr-mock',
    ]
};
