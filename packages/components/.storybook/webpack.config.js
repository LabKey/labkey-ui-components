/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */

// Export a function. Accept the base config as the only param.
module.exports = async ({ config, mode }) => {
    // `mode` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    config.devtool = 'eval-source-map';

    config.module.rules.push({
        test: /\.tsx?$/,
        loaders: ['babel-loader', {
            loader: 'ts-loader',
            options: {
                // this flag and the test regex will make sure that test files do not get bundled
                // see: https://github.com/TypeStrong/ts-loader/issues/267
                onlyCompileBundledFiles: true
            }
        }],
        exclude: /node_modules/
    });

    config.module.rules.push({
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader'],
    });

    config.resolve.extensions.push('.ts', '.tsx', '.scss');

    config.optimization = { minimize: false };

    // Return the altered config
    return config;
};
