// This module is an internal migration of the moment-jdateformatparser package.
// Due to incompatibilities and lack of active development (last active September 2018)
// we migrated the logic and tests from the package so we could maintain it.
// Original package: https://github.com/MadMG/moment-jdateformatparser
import moment from 'moment';

type FormatMapping = Record<string, string>;

/** The format pattern mapping from Java format to moment format. */
const javaToMomentFormatMapping: FormatMapping = {
    d: 'D',
    dd: 'DD',
    y: 'YYYY',
    yy: 'YY',
    yyy: 'YYYY',
    yyyy: 'YYYY',
    a: 'A',
    A: 'A',
    M: 'M',
    MM: 'MM',
    MMM: 'MMM',
    MMMM: 'MMMM',
    h: 'h',
    hh: 'hh',
    H: 'H',
    HH: 'HH',
    m: 'm',
    mm: 'mm',
    s: 's',
    ss: 'ss',
    S: 'SSS',
    SS: 'SSS',
    SSS: 'SSS',
    E: 'ddd',
    EE: 'ddd',
    EEE: 'ddd',
    EEEE: 'dddd',
    EEEEE: 'dddd',
    EEEEEE: 'dddd',
    D: 'DDD',
    w: 'W',
    ww: 'WW',
    z: 'ZZ',
    zzzz: 'Z',
    Z: 'ZZ',
    ZZZZ: 'ZZ',
    X: 'ZZ',
    XX: 'ZZ',
    XXX: 'Z',
    u: 'E',
};

/** The format pattern mapping from moment format to Java format. */
const momentToJavaFormatMapping: FormatMapping = {
    D: 'd',
    DD: 'dd',
    YY: 'yy',
    YYY: 'yyyy',
    YYYY: 'yyyy',
    a: 'a',
    A: 'a',
    M: 'M',
    MM: 'MM',
    MMM: 'MMM',
    MMMM: 'MMMM',
    h: 'h',
    hh: 'hh',
    H: 'H',
    HH: 'HH',
    m: 'm',
    mm: 'mm',
    s: 's',
    ss: 'ss',
    S: 'S',
    SS: 'S',
    SSS: 'S',
    ddd: 'E',
    dddd: 'EEEE',
    DDD: 'D',
    W: 'w',
    WW: 'ww',
    ZZ: 'z',
    Z: 'XXX',
    E: 'u',
};

/**
 * Checks if the substring is a mapped date format pattern and adds it to the result format String.
 * @param {String}  formatString    The unmodified format String.
 * @param {Object}  mapping         The date format mapping Object.
 * @param {Number}  startIndex      The begin index of the continuous format characters.
 * @param {Number}  currentIndex    The last index of the continuous format characters.
 * @param {String}  resultString    The result format String.
 */
function _appendMappedString(
    formatString: string,
    mapping: FormatMapping,
    startIndex: number,
    currentIndex: number,
    resultString: string
): string {
    if (startIndex !== -1) {
        let tempString = formatString.substring(startIndex, currentIndex);

        // check if the temporary string has a known mapping
        if (mapping[tempString]) {
            tempString = mapping[tempString];
        }

        resultString += tempString;
    }

    return resultString;
}

/** Translates the format string using the supplied mappings. */
function translateFormat(formatString: string, mapping: FormatMapping): string {
    var len = formatString.length;
    var i = 0;
    var startIndex = -1;
    var lastChar = null;
    var currentChar = '';
    var resultString = '';

    for (; i < len; i++) {
        currentChar = formatString.charAt(i);

        if (lastChar === null || lastChar !== currentChar) {
            // change detected
            resultString = _appendMappedString(formatString, mapping, startIndex, i, resultString);

            startIndex = i;
        }

        lastChar = currentChar;
    }

    return _appendMappedString(formatString, mapping, startIndex, i, resultString);
}

const javaDateFormatCache = {};
const regexp = /[^']+|('[^']*')/g;

/** Translates a Java date format string to a moment format String. */
export function toMomentFormatString(javaDateFormatString: string): string {
    if (!javaDateFormatCache[javaDateFormatString]) {
        let mapped = '';
        let part = '';

        while ((part = regexp.exec(javaDateFormatString) as any)) {
            part = part[0];

            if (part.match(/'(.*?)'/)) {
                mapped += '[' + part.substring(1, part.length - 1) + ']';
            } else {
                mapped += translateFormat(part, javaToMomentFormatMapping);
            }
        }

        javaDateFormatCache[javaDateFormatString] = mapped;
    }

    return javaDateFormatCache[javaDateFormatString];
}

/** Format a moment instance with the given Java date format String. */
export function formatWithJDF(date: moment.Moment, javaDateFormatString: string): string {
    return date.format(toMomentFormatString(javaDateFormatString));
}

const momentDateFormatsCache = {};

/** Translates the moment format string to a Java date format string */
export function toJDFString(momentFormatString: string): string {
    if (!momentDateFormatsCache[momentFormatString]) {
        momentDateFormatsCache[momentFormatString] = translateFormat(momentFormatString, momentToJavaFormatMapping);
    }

    return momentDateFormatsCache[momentFormatString];
}
