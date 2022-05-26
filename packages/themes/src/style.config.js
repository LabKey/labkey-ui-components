/*
 * Copyright (c) 2017-2022 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const baseJsDir = './styles/js/';
const styleJs = baseJsDir + 'style.js';
const ext4Js = baseJsDir + 'ext4.js';
const ext3Js = baseJsDir + 'ext3.js';

function sassLoaders(cssLoaderUrl) {
    return [
        MiniCssExtractPlugin.loader,
        {
            loader: 'css-loader',
            options: {
                url: cssLoaderUrl,
            }
        },
        {
            loader: 'resolve-url-loader',
        },
        {
            loader: 'sass-loader',
            options: {
                implementation: require('sass'),
                // "sourceMap" must be set to true when resolve-url-loader is used downstream
                sourceMap: true,
            }
        }
    ];
}

module.exports = function(env) {
    const entry = {};
    if (env && env.buildDependency) {
        entry.core = baseJsDir + 'resources.js';
    } else if (env && env.theme) {
        const themeName = env.theme;
        entry[themeName] = styleJs;
        entry['ext4_' + themeName] = ext4Js;
        entry['ext3_' + themeName] = ext3Js;
    } else {
        entry.seattle = styleJs;
        entry.ext4 = ext4Js;
        entry.ext3 = ext3Js;
    }

    return {
        context: path.resolve(__dirname, '..'),

        mode: 'production',

        devtool: false,

        entry,

        output: {
            path: path.resolve(__dirname, '../dist'),
            publicPath: './',
            filename: '[name].js'
        },

        plugins: [
            new MiniCssExtractPlugin({ filename: '[name].css' })
        ],

        resolve: {
            extensions: [ '.js' ]
        },

        externals: {
            jQuery: 'jQuery'
        },

        module: {
            rules: [
                {
                    // labkey scss
                    test: /\.s[ac]ss$/i,
                    exclude: [/node_modules/],
                    use: sassLoaders(false),
                },
                {
                    // node_modules scss
                    test: /\.s[ac]ss$/i,
                    include: [/node_modules/],
                    use: sassLoaders(true),
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
                }
            ]
        }
    }
};
