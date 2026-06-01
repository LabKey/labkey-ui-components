/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.ts',
    target: 'web',
    mode: 'production',
    module: {
        rules: [
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
        path: path.resolve(__dirname, 'dist'),
        publicPath: '',
        filename: 'test.js',
        library: {
            name: '@labkey/test',
            type: 'umd'
        },
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'config',
                    to: 'config'
                }
            ]
        }),
    ],
    externals: ['@labkey/api', 'supertest']
};
