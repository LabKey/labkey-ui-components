/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import cases from '../../../test/data/filterSuggestionCases.json';

import { buildSuggestions } from './buildSuggestions';
import { FilterSuggestion, SuggestionColumn } from './models';
import { parseSuggestionTerm } from './term';

interface SuggestionCase {
    columnSet: string;
    expected: FilterSuggestion[];
    maxSuggestions?: number;
    name: string;
    term: string;
}

const columnSets = cases.columnSets as unknown as Record<string, SuggestionColumn[]>;

describe('buildSuggestions', () => {
    test.each((cases.cases as unknown as SuggestionCase[]).map(c => [c.name, c]))('%s', (_, suggestionCase) => {
        const { columnSet, expected, maxSuggestions, term } = suggestionCase as SuggestionCase;
        expect(buildSuggestions(parseSuggestionTerm(term), columnSets[columnSet], maxSuggestions)).toEqual(expected);
    });
});
