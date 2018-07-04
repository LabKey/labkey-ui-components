const npsUtils = require('nps-utils');
const { ncp, rimraf, series } = npsUtils;

module.exports = {
    scripts: {
        build: {
            default: series(
                    rimraf('dist'),
                    'rollup -c'
            ),
            description: 'Clean dist directory and run all builds'
        }
    }
};