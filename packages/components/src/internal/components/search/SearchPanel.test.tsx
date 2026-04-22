import React from 'react';

import { fromJS, Map } from 'immutable';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import entitiesJSON from '../../../test/data/searchResults.json';

import { SearchPanelImpl, SearchPanelImplProps } from './SearchPanel';

import { SearchResultsModel } from './models';
import { getProcessedSearchHits } from './actions';

describe('SearchPanelImpl', () => {
    function defaultProps(): SearchPanelImplProps {
        return {
            appName: 'test',
            title: 'Search',
            model: undefined,
            offset: undefined,
            onPageChange: jest.fn(),
            search: jest.fn(),
            searchMetadata: undefined,
            searchTerm: undefined,
        };
    }

    test('default', () => {
        const { container } = renderWithAppContext(<SearchPanelImpl {...defaultProps()} />);

        expect(container.querySelectorAll('.search-form')).toHaveLength(1);
        expect(container.querySelectorAll('.search-form__help-link')).toHaveLength(1);

        // No search term set, so no result message or results
        expect(container.querySelectorAll('.search-panel__no-results')).toHaveLength(0);
        expect(container.querySelectorAll('.search-result__card-container')).toHaveLength(0);
        expect(container.querySelectorAll('.pagination-buttons')).toHaveLength(0);
    });

    test('No Results', () => {
        const { container } = renderWithAppContext(
            <SearchPanelImpl {...defaultProps()} searchTerm="Nothing to see here" />
        );

        expect(container.querySelectorAll('.search-form')).toHaveLength(1);
        expect(container.querySelectorAll('.search-form__help-link')).toHaveLength(1);

        // No search term set, so no result message or results
        expect(container.querySelectorAll('.search-panel__no-results')).toHaveLength(1);
        expect(container.querySelectorAll('.search-result__card-container')).toHaveLength(0);
        expect(container.querySelectorAll('.pagination-buttons')).toHaveLength(0);
    });

    test('No paging', () => {
        const hits = getProcessedSearchHits(entitiesJSON.hits);
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits })),
        });

        const { container } = renderWithAppContext(
            <SearchPanelImpl {...defaultProps()} searchTerm="see here" model={model} />
        );

        expect(container.querySelectorAll('.search-form')).toHaveLength(1);
        expect(container.querySelectorAll('.search-form__help-link')).toHaveLength(1);

        // Search term set so we have all results
        expect(container.querySelectorAll('.search-panel__no-results')).toHaveLength(0);
        expect(container.querySelectorAll('.search-result__card-container')).toHaveLength(49);
        expect(container.querySelectorAll('.pagination-buttons')).toHaveLength(0);
    });

    test('paging set', () => {
        const hits = getProcessedSearchHits(entitiesJSON.hits);
        const pageSize = 4;
        const page2 = hits.slice(pageSize, pageSize * 2);
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits: page2 })),
        });

        const { container } = renderWithAppContext(
            <SearchPanelImpl
                {...defaultProps()}
                searchTerm="see here"
                model={model}
                pageSize={pageSize}
                offset={pageSize}
            />
        );

        expect(container.querySelectorAll('.search-form')).toHaveLength(1);
        expect(container.querySelectorAll('.search-form__help-link')).toHaveLength(1);

        // No search term set, so no result message or results
        expect(container.querySelectorAll('.search-panel__no-results')).toHaveLength(0);
        expect(container.querySelectorAll('.search-result__card-container')).toHaveLength(4);
        expect(container.querySelectorAll('.pagination-buttons')).toHaveLength(1);
        expect(container.querySelector('.pagination-buttons__info').textContent).toBe('5 - 8 of 47');
    });

    test('results fit on one page', () => {
        const hits = getProcessedSearchHits(entitiesJSON.hits);
        const pageSize = 50;
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits })),
        });

        const { container } = renderWithAppContext(
            <SearchPanelImpl {...defaultProps()} searchTerm="see here" model={model} pageSize={pageSize} offset={0} />
        );

        expect(container.querySelectorAll('.search-form')).toHaveLength(1);
        expect(container.querySelectorAll('.search-form__help-link')).toHaveLength(1);

        // Search term set, so no "no-result" message
        expect(container.querySelectorAll('.search-panel__no-results')).toHaveLength(0);
        expect(container.querySelectorAll('.search-result__card-container')).toHaveLength(49);
        // All results fit on the page, so no pagination buttons
        expect(container.querySelectorAll('.pagination-buttons')).toHaveLength(0);
    });

    test('Last page', () => {
        const hits = getProcessedSearchHits(entitiesJSON.hits);
        const pageSize = 20;
        const offset = pageSize * 2;
        const page3 = hits.slice(offset, offset + pageSize);
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits: page3 })),
        });

        const { container } = renderWithAppContext(
            <SearchPanelImpl
                {...defaultProps()}
                searchTerm="see here"
                model={model}
                pageSize={pageSize}
                offset={offset}
            />
        );

        expect(container.querySelectorAll('.search-form')).toHaveLength(1);
        expect(container.querySelectorAll('.search-form__help-link')).toHaveLength(1);

        // Search term set, so no "no-results" message
        expect(container.querySelectorAll('.search-panel__no-results')).toHaveLength(0);
        expect(container.querySelectorAll('.search-result__card-container')).toHaveLength(9);
        expect(container.querySelectorAll('.pagination-buttons')).toHaveLength(1);
        expect(container.querySelector('.pagination-buttons__info').textContent).toBe('41 - 47 of 47');
    });
});
