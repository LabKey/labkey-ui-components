/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Utility method to asynchronously sleep for a specified number of milliseconds.
 * @param ms number of milliseconds to sleep.
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
