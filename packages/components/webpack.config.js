/*
 * Copyright (c) 2016-2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const IgnorePlugin = require('webpack').IgnorePlugin;

module.exports = {
    entry: './src/index.ts',
    target: 'web',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'css-loader'
                ]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },{
                        loader: 'resolve-url-loader',
                        options: {
                            silent: true,
                        }
                    },{
                        loader: 'sass-loader',
                        options: {
                            implementation: require('sass'),
                            sourceMap: true,
                            warnRuleAsWarning: true,
                        }
                    }
                ]
            },
            {
                test: /\.(woff|woff2)$/,
                type: 'asset',
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
            },
            {
                test: /\.png(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
            },
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        // this flag and the test regex will make sure that test files do not get bundled
                        // see: https://github.com/TypeStrong/ts-loader/issues/267
                        onlyCompileBundledFiles: true
                    },
                },
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [ '.jsx', '.js', '.tsx', '.ts' ]
    },
    optimization: {
        // don't minimize the code from components, module/app usages will be doing that if they want to
        minimize: false
    },
    output: {
        path: path.resolve(__dirname, 'staging'),
        publicPath: '',
        filename: 'components.js',
        library: {
            name: '@labkey/components',
            type: 'umd'
        },
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    // copy static scss files into the dist dir to be used by LabKey module apps
                    from: 'src/internal/app/scss',
                    to: 'assets/scss'
                }
            ]
        }),
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
        })
    ],
    externals: [
        '@labkey/api',
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
