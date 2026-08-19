/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
const entryPoints = require('../../../../src/client/entryPoints');
const constants = require('./constants');
const { rspack } = require('@rspack/core');

module.exports = {
    context: constants.context,
    ignoreWarnings: constants.ignoreWarnings,
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
            // Use Rspack's built-in SWC-based JS minimizer (replaces terser-webpack-plugin). SWC's compress options
            // mirror Terser's, so the existing workaround carries over verbatim. Specifying only the JS minimizer
            // here (rather than relying on Rspack's defaults, which also include a CSS minimizer) matches the prior
            // webpack behavior, where only JS was minified.
            // See https://rspack.rs/plugins/rspack/swc-js-minimizer-rspack-plugin
            new rspack.SwcJsMinimizerRspackPlugin({
                minimizerOptions: {
                    // For other "compress" options see https://swc.rs/docs/configuration/minification
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

