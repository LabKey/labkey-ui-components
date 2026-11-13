/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

// Seeded PRNG (mulberry32). Reads TEST_SEED at module load time;
// falls back to Date.now() if not set.
function _mulberry32(seed: number): () => number {
    return function () {
        seed |= 0;
        seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const _seedStr = typeof process !== 'undefined' ? process.env?.TEST_SEED : undefined;
const _seed = _seedStr !== undefined ? (parseInt(_seedStr, 10) >>> 0) : (Date.now() >>> 0);

/** Seeded drop-in for Math.random(). Use in tests instead of Math.random()
 *  so runs are reproducible via the TEST_SEED environment variable.
 *
 *  Note: this is a module-level singleton — all test files loaded in the same Jest worker share
 *  one sequence. With --maxWorkers 1 (the default for integration tests) this means full
 *  reproducibility: the same seed always produces the same sequence regardless of which file
 *  calls random() and in what order. If --maxWorkers is increased, each worker gets its own
 *  copy of this module initialized from the same TEST_SEED, so files on different workers draw
 *  from independent sequences — a multi-worker run may not reproduce identically under
 *  --maxWorkers 1 even with the same seed. */
export const random = _mulberry32(_seed);

/** The seed used for this test run. Log it so failures can be reproduced with TEST_SEED=<value>. */
export const testSeed = _seed;

const QUERY_KEY_CHARSET = '$/&}~,.';
const ALPHA = 'ABCDabcvxyz';
const NUMERIC = '0123456789';
const SPECIAL = '~!@#$%^&*()-+=_{}[]|:;\"\',.<>';
const DOMAIN_SPECIAL_STRING =  "+- _.:&()/";
const WHITE_SPACE = ' \t\n\u00A0';
const FIELD_NAME_CHARSET = ALPHA + NUMERIC + QUERY_KEY_CHARSET + SPECIAL + ' '/*only space is allowed, no other whitespace chars*/;
const STRING_CHARSET = ALPHA + NUMERIC + QUERY_KEY_CHARSET + SPECIAL + WHITE_SPACE;

/**
 * Utility method to asynchronously sleep for a specified number of milliseconds.
 * @param ms number of milliseconds to sleep.
 */
export const sleep = (ms = 0): Promise<void> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
};

export function shuffleArray<T>(original: T[]) : T[] {
    const array = [...original];
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function selectRandomN<T>(choices: T[], selectCount = 1) : T[] {
    if (!choices || selectCount < 0 || selectCount > choices.length)
        return [];
    const shuffled = shuffleArray(choices)
    return shuffled.slice(0, selectCount);
}

export function generateRandomStr(length: number = 8, charset: string = STRING_CHARSET, excluded: string = '\r') {
    let result = '';
    const charsetLength = charset.length;

    while (result.length < length) {
        const randomIndex = Math.floor(random() * charsetLength);
        const select = charset[randomIndex];
        if (!excluded || excluded.indexOf(select) === -1)
            result += charset[randomIndex];
    }

    return result.trim();
}

export function generateNamingExpressionConstant(length: number = 8, charset: string = STRING_CHARSET) {
    return generateRandomStr(length, charset, '{}\r\n');
}

export function generateFieldName(length: number = 5, charset: string = FIELD_NAME_CHARSET) {
    return generateRandomStr(length, charset);
}

function valueText(value: unknown): string {
    if (value === null || value === undefined) return '';
    // String(date) is locale-formatted; the server parses the ISO instant, Z included
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') {
        throw new Error(`Can't write an object as a TSV value: ${JSON.stringify(value)}`);
    }
    return String(value);
}

// Quotes one element of a multi-value cell, which the server splits on commas outside quotes
function listElement(value: unknown): string {
    const str = valueText(value);
    if (/[,"\r\n\\]/.test(str) || str !== str.trim()) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

/**
 * Formats one value as a TSV cell, quoting it when the server would otherwise split, trim, skip it as a comment, or read
 * it as null (a literal \N). Arrays become one multi-value cell, with each element quoted as needed and joined with
 * ", "; dates are written as ISO-8601 instants; null and undefined become empty cells.
 * @param value the value to format.
 * @throws if the value contains \r, which the server reads as a line break and stores as \n.
 */
export function tsvValue(value: unknown): string {
    const str = Array.isArray(value) ? value.map(listElement).join(', ') : valueText(value);

    if (str.includes('\r')) {
        throw new Error(`Value ${JSON.stringify(str)} contains \\r, which the server would store as \\n`);
    }
    if (/[\t\n"]/.test(str) || str.startsWith('#') || str !== str.trim() || str === '\\N') {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

/**
 * Builds TSV import text from rows of values, quoting cells as needed via {@link tsvValue}.
 * @param rows the rows to write, including any header row.
 * @throws if every cell in a row is empty, since the server skips such rows on import however they're written.
 */
export function tsvStringFromRows(rows: unknown[][]): string {
    return rows
        .map((row, i) => {
            const cells = row.map(tsvValue);
            if (cells.every(cell => cell === '')) {
                throw new Error(`Row ${i} has no values, so the server would skip it on import`);
            }
            return cells.join('\t') + '\n';
        })
        .join('');
}

/**
 * Builds TSV import text, with a header row, from row maps, quoting cells as needed via {@link tsvValue}.
 * @param rowMaps the rows to write; a column a row lacks is written as an empty cell.
 * @param columns the columns to write, in order; defaults to every key found across the rows.
 * @throws if every cell in a row is empty, since the server skips such rows on import however they're written.
 */
export function tsvStringFromRowMaps(rowMaps: Record<string, unknown>[], columns?: string[]): string {
    const cols = columns ?? [...new Set(rowMaps.flatMap(row => Object.keys(row)))];
    return tsvStringFromRows([cols, ...rowMaps.map(row => cols.map(col => row[col]))]);
}

export function generateDomainName(length: number = 5) {
    let result = generateRandomStr(2, ALPHA + NUMERIC) + generateRandomStr(length, DOMAIN_SPECIAL_STRING + ALPHA + NUMERIC + ' ');
    result = result.trim();
    result = result.replace(' -', "")
    return result
}

export function getEscapedNameExpression(expression: string) {
    return expression
        .replace(/\\/g, "\\\\")
        .replace(/\$/g, "\\\$")
        .replace(/\//g, '\\/')
        .replace(/&/g, '\\&')
        .replace(/}/g, '\\}')
        .replace(/~/g, '\\~')
        .replace(/,/g, '\\,')
        .replace(/\./g, '\\.');
}
