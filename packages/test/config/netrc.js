// https://github.com/camshaft/netrc/blob/2c12249c7812c33a08a278eb1d5a565595f23d70/index.js
/**
 * Module dependencies
 */
var fs = require('fs');
var join = require('path').join;

/**
 * Read and parse netrc file
 *
 * @param {String} file
 * @return {Object}
 * @api public
 */

module.exports = exports = function(file) {
    var home = getHomePath();

    if (!file && !home) return {};
    file = file || join(home, exports.getNetrcFileName());

    if (!file || !fs.existsSync(file)) return {};
    var netrc = fs.readFileSync(file, 'UTF-8');
    return exports.parse(netrc);
};

/**
 * Parse netrc
 *
 * @param {String} content
 * @return {Object}
 * @api public
 */

exports.parse = function(content) {
    // Remove comments
    var lines = content.split('\n');
    for (var n in lines) {
        var i = lines[n].indexOf('#');
        if (i > -1) lines[n] = lines[n].substring(0, i);
    }
    content = lines.join('\n');

    var tokens = content.split(/[ \t\n\r]+/);
    var machines = {};
    var m = null;
    var key = null;

    // if first index in array is empty string, strip it off (happens when first line of file is comment. Breaks the parsing)
    if (tokens[0] === '') tokens.shift();

    for(var i = 0, key, value; i < tokens.length; i+=2) {
        key = tokens[i];
        value = tokens[i+1];

        // Whitespace
        if (!key || !value) continue;

        // We have a new machine definition
        if (key === 'machine') {
            m = {};
            machines[value] = m;
        }
        // key=value
        else {
            m[key] = value;
        }
    }

    return machines
};

/**
 * Get the OS-dependent netrc file name.
 *
 * @returns {string}
 */

exports.getNetrcFileName = function() {
    return isWindows() ? '_netrc' : '.netrc';
};

function getHomePath() {
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

function isWindows() {
    return process.platform === 'win32';
}
