/*
 * Copyright (c) 2018 LabKey Corporation
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
                    'rollup -c'
            ),
            description: 'Clean dist directory and run all builds'
        },
        clean: {
            default: rimraf('dist')
        },
        cleanAll: {
            default: series(
                rimraf('.rpt2_cache'),
                rimraf('node_modules'),
                rimraf('dist')
            )
        }
    }
};