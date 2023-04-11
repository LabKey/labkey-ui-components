import React from 'react';

import { fromJS, Map } from 'immutable';

import { mountWithAppServerContext } from '../../testHelpers';

import { PaginationButtons } from '../buttons/PaginationButtons';

import entitiesJSON from '../../../test/data/searchResults.json';

import { SearchPanelImpl } from './SearchPanel';

import { SearchResultCard } from './SearchResultCard';

import { SearchResultsModel } from './models';
import { getProcessedSearchHits } from './actions';

const DEFAULT_PROPS = {
    appName: 'test',
    offset: undefined,
    onPage: jest.fn(),
    search: jest.fn(),
    searchResultsModel: undefined,
    searchTerm: undefined,
};

describe('<SearchPanelImpl />', () => {
    test('default', () => {
        const wrapper = mountWithAppServerContext(<SearchPanelImpl {...DEFAULT_PROPS} />);

        expect(wrapper.find('.search-form')).toHaveLength(1);
        expect(wrapper.find('HelpLink.search-form__help-link')).toHaveLength(1);

        // No search term set, so no result message or results
        expect(wrapper.find('.search-panel__no-results')).toHaveLength(0);
        expect(wrapper.find(SearchResultCard)).toHaveLength(0);
        expect(wrapper.find(PaginationButtons)).toHaveLength(0);
    });

    test('No Results', () => {
        const wrapper = mountWithAppServerContext(
            <SearchPanelImpl {...DEFAULT_PROPS} searchTerm="Nothing to see here" />
        );

        expect(wrapper.find('.search-form')).toHaveLength(1);
        expect(wrapper.find('HelpLink.search-form__help-link')).toHaveLength(1);

        // No search term set, so no result message or results
        expect(wrapper.find('.search-panel__no-results')).toHaveLength(1);
        expect(wrapper.find(SearchResultCard)).toHaveLength(0);
        expect(wrapper.find(PaginationButtons)).toHaveLength(0);
    });

    test('No paging', () => {
        const hits = getProcessedSearchHits(entitiesJSON['hits']);
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits })),
        });

        const wrapper = mountWithAppServerContext(
            <SearchPanelImpl {...DEFAULT_PROPS} searchTerm="see here" searchResultsModel={model} />
        );

        expect(wrapper.find('.search-form')).toHaveLength(1);
        expect(wrapper.find('HelpLink.search-form__help-link')).toHaveLength(1);

        // No search term set, so no result message or results
        expect(wrapper.find('.search-panel__no-results')).toHaveLength(0);
        expect(wrapper.find(SearchResultCard)).toHaveLength(47);
        expect(wrapper.find(PaginationButtons)).toHaveLength(0);
    });

    test('paging set', () => {
        const hits = getProcessedSearchHits(entitiesJSON['hits']);
        const pageSize = 4;
        const page2 = hits.slice(pageSize, pageSize * 2);
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits: page2 })),
        });

        const wrapper = mountWithAppServerContext(
            <SearchPanelImpl
                {...DEFAULT_PROPS}
                searchTerm="see here"
                searchResultsModel={model}
                pageSize={pageSize}
                offset={pageSize}
            />
        );

        expect(wrapper.find('.search-form')).toHaveLength(1);
        expect(wrapper.find('HelpLink.search-form__help-link')).toHaveLength(1);

        // No search term set, so no result message or results
        expect(wrapper.find('.search-panel__no-results')).toHaveLength(0);
        expect(wrapper.find(SearchResultCard)).toHaveLength(4);
        expect(wrapper.find(PaginationButtons)).toHaveLength(1);
        expect(wrapper.find('.pagination-buttons__info').text()).toBe('5 - 8 of 47');
    });

    test('results fit on one page', () => {
        const hits = getProcessedSearchHits(entitiesJSON['hits']);
        const pageSize = 50;
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits })),
        });

        const wrapper = mountWithAppServerContext(
            <SearchPanelImpl
                {...DEFAULT_PROPS}
                searchTerm="see here"
                searchResultsModel={model}
                pageSize={pageSize}
                offset={0}
            />
        );

        expect(wrapper.find('.search-form')).toHaveLength(1);
        expect(wrapper.find('HelpLink.search-form__help-link')).toHaveLength(1);

        // Search term set, so no "no-result" message
        expect(wrapper.find('.search-panel__no-results')).toHaveLength(0);
        expect(wrapper.find(SearchResultCard)).toHaveLength(47);
        // All results fit on the page, so no pagination buttons
        expect(wrapper.find(PaginationButtons)).toHaveLength(0);
    });

    test('Last page', () => {
        const hits = getProcessedSearchHits(entitiesJSON['hits']);
        const pageSize = 20;
        const offset = pageSize * 2;
        const page3 = hits.slice(offset, offset + pageSize);
        const model = SearchResultsModel.create({
            entities: Map(fromJS({ ...entitiesJSON, hits: page3 })),
        });

        const wrapper = mountWithAppServerContext(
            <SearchPanelImpl
                {...DEFAULT_PROPS}
                searchTerm="see here"
                searchResultsModel={model}
                pageSize={pageSize}
                offset={offset}
            />
        );

        expect(wrapper.find('.search-form')).toHaveLength(1);
        expect(wrapper.find('HelpLink.search-form__help-link')).toHaveLength(1);

        // Search term set, so no "no-results" message
        expect(wrapper.find('.search-panel__no-results')).toHaveLength(0);
        expect(wrapper.find(SearchResultCard)).toHaveLength(7);
        expect(wrapper.find(PaginationButtons)).toHaveLength(1);
        expect(wrapper.find('.pagination-buttons__info').text()).toBe('41 - 47 of 47');
    });
});
