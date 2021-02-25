/*
 * Copyright (c) 2016-2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const IgnorePlugin = require('webpack').IgnorePlugin;
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

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
                test: /\.scss$/,
                use: [
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1
                        }
                    },{
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, loader: "file-loader" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=image/svg+xml" },
            { test: /\.png(\?v=\d+\.\d+\.\d+)?$/, loader: "url-loader?limit=10000&mimetype=image/png" },
            {
                test: /\.tsx?$/,
                loaders: [{
                    loader: 'ts-loader',
                    options: {
                        // this flag and the test regex will make sure that test files do not get bundled
                        // see: https://github.com/TypeStrong/ts-loader/issues/267
                        onlyCompileBundledFiles: true
                    }
                }],
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
        filename: 'components.js',
        library: '@labkey/components',
        libraryTarget: 'umd'
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
        new IgnorePlugin(/^\.\/locale$/, /moment$/),
        // new BundleAnalyzerPlugin()
    ],
    externals: ['react', 'react-dom', 'reactn', 'react-bootstrap', 'immutable', 'jquery']
};
