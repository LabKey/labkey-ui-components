/*
 * Copyright (c) 2016-2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    entry: './src/index.ts',
    target: 'web',
    mode: 'production',
    // devtool: 'inline-source-map', //TODO https://webpack.js.org/configuration/devtool/#root
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
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
                //     loader: 'babel-loader',
                //     options: {
                //         babelrc: false,
                //         cacheDirectory: true,
                //         presets: [
                //             "@babel/preset-env",
                //             "@babel/preset-react"
                //         ]
                //     }
                // },{
                    loader: 'ts-loader',
                    options: {
                        // this flag and the test regex will make sure that test files do not get bundled
                        // see: https://github.com/TypeStrong/ts-loader/issues/267
                        onlyCompileBundledFiles: true
                    }
                }],
                exclude: /node_modules/,
            }
        ]
    },
    resolve: {
        extensions: [ '.jsx', '.js', '.tsx', '.ts' ]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        publicPath: '',
        filename: 'components.js',
        library: '@labkey/components',
        libraryTarget: 'commonjs2'
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'components.css'
        })
    ]
};
