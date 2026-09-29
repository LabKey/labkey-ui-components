/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

export type DatePrecision = 'day' | 'month' | 'year';

export interface DateSpan {
    end: string; // inclusive, yyyy-MM-dd
    precision: DatePrecision;
    start: string; // yyyy-MM-dd
}

export interface SuggestionTerm {
    dateSpan?: DateSpan;
    // Multi-digit integers with a leading zero (e.g. barcodes) are identifiers, not quantities
    hasLeadingZero?: boolean;
    isInteger?: boolean;
    number?: number;
    raw: string;
}

const NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;
const YEAR_PATTERN = /^(\d{4})$/;
const YEAR_MONTH_PATTERN = /^(\d{4})[-/](\d{1,2})$/;
const FULL_DATE_PATTERN = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T]\d{1,2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)?$/;
const MONTH_NAME_YEAR_PATTERN = /^([A-Za-z]{3,9})\.?\s+(\d{4})$/;
const MONTH_NAMES = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
];

const pad = (n: number): string => String(n).padStart(2, '0');

const isoDate = (year: number, month: number, day: number): string => `${year}-${pad(month)}-${pad(day)}`;

const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

function monthSpan(year: number, month: number): DateSpan {
    if (month < 1 || month > 12) return undefined;
    return {
        end: isoDate(year, month, daysInMonth(year, month)),
        precision: 'month',
        start: isoDate(year, month, 1),
    };
}

function monthFromName(name: string): number {
    const lc = name.toLowerCase();
    const index = MONTH_NAMES.findIndex(month => month === lc || (lc.length === 3 && month.startsWith(lc)));
    return index + 1;
}

/**
 * Parses ISO-style dates only (yyyy, yyyy-MM, yyyy-MM-dd with an optional time, "MMM yyyy"). Slash-delimited
 * month/day orders are ambiguous without the server's date parsing mode, so they are not recognized.
 */
export function parseDateSpan(raw: string): DateSpan {
    let match = FULL_DATE_PATTERN.exec(raw);
    if (match) {
        const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
        if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return undefined;
        const date = isoDate(year, month, day);
        return { end: date, precision: 'day', start: date };
    }

    match = YEAR_MONTH_PATTERN.exec(raw);
    if (match) return monthSpan(Number(match[1]), Number(match[2]));

    match = MONTH_NAME_YEAR_PATTERN.exec(raw);
    if (match) {
        const month = monthFromName(match[1]);
        return month > 0 ? monthSpan(Number(match[2]), month) : undefined;
    }

    match = YEAR_PATTERN.exec(raw);
    if (match) {
        const year = Number(match[1]);
        return { end: isoDate(year, 12, 31), precision: 'year', start: isoDate(year, 1, 1) };
    }

    return undefined;
}

export function parseSuggestionTerm(term: string): SuggestionTerm {
    const raw = term?.trim() ?? '';
    const parsed: SuggestionTerm = { raw };
    if (!raw) return parsed;

    if (NUMBER_PATTERN.test(raw)) {
        parsed.number = Number(raw);
        parsed.isInteger = !raw.includes('.');
        parsed.hasLeadingZero = /^-?0\d/.test(raw);
    }

    parsed.dateSpan = parseDateSpan(raw);

    return parsed;
}
