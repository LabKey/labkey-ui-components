/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
const npsUtils = require('nps-utils');
const { rimraf, series } = npsUtils;

module.exports = {
    scripts: {
        build: {
            default: series(
                rimraf('dist'),
                'node src/buildThemes.js'
            ),
            description: 'Clean dist directory and run all builds'
        },
        clean: {
            default: rimraf('dist')
        },
        cleanAll: {
            default: series(
                rimraf('dist'),
                rimraf('node_modules')
            )
        }
    }
};
