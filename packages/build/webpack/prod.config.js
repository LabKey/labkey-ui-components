/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
const entryPoints = require('../../../../src/client/entryPoints');
const constants = require('./constants');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    context: constants.context,
    mode: 'production',
    devtool: process.env.PROD_SOURCE_MAP || 'nosources-source-map',
    entry: constants.processEntries(entryPoints),
    output: {
        path: constants.outputPath,
        publicPath: './', // allows context path to resolve in both js/css
        filename: '[name].[contenthash].cache.js'
    },
    module: {
        rules: constants.loaders.TYPESCRIPT.concat(
            constants.loaders.STYLE,
            constants.loaders.FILES,
            constants.loaders.SOURCE_MAP
        ),
    },
    resolve: {
        alias: constants.aliases.LABKEY_PACKAGES,
        extensions: constants.extensions.TYPESCRIPT
    },
    optimization: {
        minimize: true,
        minimizer: [
            // Use the defacto Webpack Terser plugin which comes distributed with webpack.
            // See https://webpack.js.org/plugins/terser-webpack-plugin
            new TerserPlugin({
                terserOptions: {
                    // For other "compress" options see https://github.com/terser/terser#compress-options
                    compress: {
                        // Disable "Collapse single-use non-constant variables, side effects permitting."
                        // There are some cases where this optimization fails to recognize a side effect
                        // resulting in a change in behavior from the non-minified code.
                        collapse_vars: false,
                    },
                },
            }),
        ],
        splitChunks: {
            maxSize: 2 * 1000000, // 2 MB
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all'
                }
            }
        }
    },
    plugins: constants.processPlugins(entryPoints),
};

