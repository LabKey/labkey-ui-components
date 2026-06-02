/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import {
    getOntologySearchTerm,
    OntologySearchResultsMenu,
    OntologyTreeSearchContainer,
} from './OntologyTreeSearchContainer';
import { ConceptModel, OntologyModel } from './models';

const TEST_ONTOLOGY = new OntologyModel({
    abbreviation: 't',
    name: 'test name',
    conceptCount: 100,
    description: 'test desc',
});

const TEST_SEARCH_HITS = [
    new ConceptModel({ code: 'a', label: 'A', description: 'Description for a' }),
    new ConceptModel({ code: 'b', label: 'B', description: 'Description for b' }),
];

describe('OntologyTreeSearchContainer', () => {
    test('default props', () => {
        const { container } = render(
            <OntologyTreeSearchContainer ontology={TEST_ONTOLOGY} searchPathClickHandler={jest.fn()} />
        );
        expect(container.querySelector('.concept-search-container')).not.toBeNull();
        expect(container.querySelector('input')).not.toBeNull();
        expect((container.querySelector('input') as HTMLInputElement).placeholder).toBe('Search t');
        expect(container.querySelector('ul.result-menu')).toBeNull();
    });
});

const DEFAULT_PROPS = {
    searchHits: undefined,
    totalHits: undefined,
    isFocused: true,
    error: undefined,
    onItemClick: jest.fn(),
};

describe('OntologySearchResultsMenu', () => {
    test('showMenu', () => {
        const { container, rerender } = render(<OntologySearchResultsMenu {...DEFAULT_PROPS} isFocused={false} />);
        expect(container.querySelector('ul.result-menu')).toBeNull();
        expect(container.querySelectorAll('li')).toHaveLength(0);

        rerender(<OntologySearchResultsMenu {...DEFAULT_PROPS} isFocused={true} />);
        expect(container.querySelector('ul.result-menu')).toBeNull();

        rerender(<OntologySearchResultsMenu {...DEFAULT_PROPS} isFocused={true} searchHits={[]} />);
        expect(container.querySelector('ul.result-menu')).not.toBeNull();
        expect(container.querySelectorAll('li')).toHaveLength(1);

        rerender(<OntologySearchResultsMenu {...DEFAULT_PROPS} error="test error" isFocused={true} />);
        expect(container.querySelector('ul.result-menu')).not.toBeNull();
        expect(container.querySelectorAll('li')).toHaveLength(0);
    });

    test('error', () => {
        const { container } = render(<OntologySearchResultsMenu {...DEFAULT_PROPS} error="test error" />);
        expect(container.querySelector('ul.result-menu')).not.toBeNull();
        expect(container.querySelector('[role="alert"]')).not.toBeNull();
        expect(container.querySelector('[role="alert"]').textContent).toBe('test error');
    });

    test('no search results found', () => {
        const { container } = render(<OntologySearchResultsMenu {...DEFAULT_PROPS} searchHits={[]} />);
        expect(container.querySelector('ul.result-menu')).not.toBeNull();
        expect(container.querySelectorAll('li')).toHaveLength(1);
        expect(container.querySelector('li').textContent).toBe('No search results found.');
    });

    test('totalHits footer', () => {
        const { container } = render(<OntologySearchResultsMenu {...DEFAULT_PROPS} searchHits={[]} totalHits={2} />);
        expect(container.querySelector('ul.result-menu')).not.toBeNull();
        expect(container.querySelector('.result-footer')).not.toBeNull();
        expect(container.querySelector('.result-footer').textContent).toContain('2 results found.');
    });

    test('with searchHits, with descriptions', () => {
        const { container } = render(
            <OntologySearchResultsMenu
                {...DEFAULT_PROPS}
                searchHits={TEST_SEARCH_HITS}
                totalHits={TEST_SEARCH_HITS.length}
            />
        );
        expect(container.querySelector('ul.result-menu')).not.toBeNull();
        expect(container.querySelectorAll('li')).toHaveLength(TEST_SEARCH_HITS.length);
        expect(container.querySelectorAll('.selectable-item')).toHaveLength(TEST_SEARCH_HITS.length);
        const boldItems = container.querySelectorAll('.bold');
        expect(boldItems).toHaveLength(TEST_SEARCH_HITS.length);
        expect(boldItems[0].textContent).toBe(TEST_SEARCH_HITS[0].label);
        expect(boldItems[1].textContent).toBe(TEST_SEARCH_HITS[1].label);
        const codeItems = container.querySelectorAll('.col-xs-2');
        expect(codeItems[0].textContent).toBe(TEST_SEARCH_HITS[0].code);
        expect(codeItems[1].textContent).toBe(TEST_SEARCH_HITS[1].code);
        expect(container.querySelectorAll('.col-xs-10')).toHaveLength(0);
        const colXs5Items = container.querySelectorAll('.col-xs-5');
        expect(colXs5Items).toHaveLength(TEST_SEARCH_HITS.length * 2);
        expect(colXs5Items[colXs5Items.length - 1].textContent).toBe(TEST_SEARCH_HITS[1].description);
    });

    test('with searchHits, without descriptions', () => {
        const searchHits = [new ConceptModel({ code: 'a', label: 'A' })];
        const { container } = render(
            <OntologySearchResultsMenu {...DEFAULT_PROPS} searchHits={searchHits} totalHits={searchHits.length} />
        );
        expect(container.querySelectorAll('li')).toHaveLength(searchHits.length);
        expect(container.querySelectorAll('.col-xs-5')).toHaveLength(0);
        expect(container.querySelectorAll('.col-xs-10')).toHaveLength(searchHits.length);
        expect(container.querySelector('.col-xs-10').textContent).toBe(searchHits[0].label);
    });
});

describe('getOntologySearchTerm', () => {
    test('validate', () => {
        const ont = new OntologyModel({ abbreviation: 'abbr' });
        expect(getOntologySearchTerm(ont, 'test')).toBe('+ontology:abbr AND ("test" OR test)');
        expect(getOntologySearchTerm(ont, 'test 123')).toBe('+ontology:abbr AND ("test 123" OR test 123)');
    });
});
