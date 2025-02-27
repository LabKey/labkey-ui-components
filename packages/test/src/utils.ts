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

const QUERY_KEY_CHARSET = '$/&}~,.';
const ALPHA = 'ABCDabcvxyz';
const NUMERIC = '0123456789';
const SPECIAL = '~!@#$%^&*()-+=_{}[]|:;\"\',.<>';
const DOMAIN_SPECIAL_STRING =  "+- _.:&()/";
const WHITE_SPACE = ' \t\n\r\u00A0';
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
        const j = Math.floor(Math.random() * (i + 1));
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

export function generateRandomStr(length: number = 8, charset: string = STRING_CHARSET) {
    let result = '';
    const charsetLength = charset.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charsetLength);
        result += charset[randomIndex];
    }

    return result.trim();
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
