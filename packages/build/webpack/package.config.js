/*
 * Copyright (c) 2016-2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const constants = require('./constants');
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
    entry: './src/index.ts',
    target: 'web',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['css-loader'],
            },
            {
                test: /\.s[ac]ss$/,
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            implementation: require('sass'),
                            sourceMap: true
                        }
                    }
                ]
            },
            // TODO: remove this after we confirm that babel/fork-ts-checker produce compatible builds
            // {
            //     test: /\.tsx?$/,
            //     use: {
            //         loader: 'ts-loader',
            //         options: {
            //             // this flag and the test regex will make sure that test files do not get bundled
            //             // see: https://github.com/TypeStrong/ts-loader/issues/267
            //             onlyCompileBundledFiles: true,
            //             configFile: constants.tsconfigPath,
            //         },
            //     },
            //     exclude: /node_modules/
            // }
        ].concat(constants.loaders.TYPESCRIPT),
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
        new ForkTsCheckerWebpackPlugin(constants.TS_CHECKER_CONFIG),
        new CopyWebpackPlugin({
            patterns: [
                {
                    // copy theme scss files into the dist dir to be used by LabKey module apps
                    from: 'src/theme',
                    to: 'assets/scss/theme'
                }
            ]
        })
    ],
    externals: [
        '@labkey/api',
        '@labkey/components',
        'immutable',
        'jquery',
        'moment',
        'react',
        'react-bootstrap',
        'react-dom',
    ]
};
