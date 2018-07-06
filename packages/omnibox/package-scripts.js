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