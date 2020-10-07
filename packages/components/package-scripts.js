/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const npsUtils = require('nps-utils');
const { rimraf, series, ncp } = npsUtils;

module.exports = {
    scripts: {
        build: {
            default: series(
                rimraf('staging'),
                'webpack --config webpack.config.js',
                rimraf('dist'),
                "ncp staging dist",
            ),
            description: 'Clean dist and staging directories and run all builds'
        },
        clean: {
            default: series(
                rimraf('dist'),
                rimraf('staging')
            ),
            description: 'Remove the dist and staging directories'
        },
        cleanAll: {
            default: series(
                rimraf('dist'),
                rimraf('staging'),
                rimraf('node_modules')
            ),
            description: 'Remove the dist, staging, and node_modules directories'
        }
    }
};
