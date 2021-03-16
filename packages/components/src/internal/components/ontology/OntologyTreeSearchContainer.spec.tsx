import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Alert } from '../../..';

import { OntologySearchResultsMenu, OntologyTreeSearchContainer } from './OntologyTreeSearchContainer';
import { ConceptModel, OntologyModel } from './models';

const TEST_ONTOLOGY = new OntologyModel({
    abbreviation: 't',
    name: 'test name',
    conceptCount: 100,
    description: 'test desc',
});

const TEST_SEARCH_HITS = [
    new ConceptModel({
        code: 'a',
        label: 'A',
        description: 'Description for a',
    }),
    new ConceptModel({
        code: 'b',
        label: 'B',
        description: 'Description for b',
    }),
];

describe('OntologyTreeSearchContainer', () => {
    test('default props', () => {
        const wrapper = mount(
            <OntologyTreeSearchContainer ontology={TEST_ONTOLOGY} searchPathClickHandler={jest.fn} />
        );
        expect(wrapper.find('.concept-search-container')).toHaveLength(1);
        expect(wrapper.find('input')).toHaveLength(1);
        expect(wrapper.find('input').prop('placeholder')).toBe('Search t');
        expect(wrapper.find(OntologySearchResultsMenu)).toHaveLength(1);
        wrapper.unmount();
    });
});

const DEFAULT_PROPS = {
    searchHits: undefined,
    totalHits: undefined,
    isFocused: true,
    error: undefined,
    onItemClick: jest.fn,
};

describe('OntologySearchResultsMenu', () => {
    function validate(wrapper: ReactWrapper, showMenu = false, itemCount = 0, showFooter = false): void {
        expect(wrapper.find('ul.result-menu')).toHaveLength(showMenu ? 1 : 0);
        expect(wrapper.find(Alert)).toHaveLength(showMenu ? 1 : 0);
        expect(wrapper.find('li')).toHaveLength(itemCount);
        expect(wrapper.find('.result-footer')).toHaveLength(showFooter ? 1 : 0);
    }

    test('showMenu', () => {
        let wrapper = mount(<OntologySearchResultsMenu {...DEFAULT_PROPS} isFocused={false} />);
        validate(wrapper);
        wrapper.unmount();

        wrapper = mount(<OntologySearchResultsMenu {...DEFAULT_PROPS} isFocused={true} />);
        validate(wrapper);
        wrapper.unmount();

        wrapper = mount(<OntologySearchResultsMenu {...DEFAULT_PROPS} isFocused={true} searchHits={[]} />);
        validate(wrapper, true, 1);
        wrapper.unmount();

        wrapper = mount(<OntologySearchResultsMenu {...DEFAULT_PROPS} isFocused={true} error="test error" />);
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('error', () => {
        const wrapper = mount(<OntologySearchResultsMenu {...DEFAULT_PROPS} error="test error" />);
        validate(wrapper, true);
        expect(wrapper.find(Alert).text()).toBe('test error');
        wrapper.unmount();
    });

    test('no search results found', () => {
        const wrapper = mount(<OntologySearchResultsMenu {...DEFAULT_PROPS} searchHits={[]} />);
        validate(wrapper, true, 1);
        expect(wrapper.find('li').text()).toBe('No search results found.');
        wrapper.unmount();
    });

    test('totalHits footer', () => {
        const wrapper = mount(<OntologySearchResultsMenu {...DEFAULT_PROPS} searchHits={[]} totalHits={2} />);
        validate(wrapper, true, 1, true);
        expect(wrapper.find('.result-footer').text()).toContain('2 results found.');
        wrapper.unmount();
    });

    test('with searchHits, with descriptions', () => {
        const wrapper = mount(
            <OntologySearchResultsMenu
                {...DEFAULT_PROPS}
                searchHits={TEST_SEARCH_HITS}
                totalHits={TEST_SEARCH_HITS.length}
            />
        );
        validate(wrapper, true, TEST_SEARCH_HITS.length);
        expect(wrapper.find('.selectable-item')).toHaveLength(TEST_SEARCH_HITS.length);
        expect(wrapper.find('.bold')).toHaveLength(TEST_SEARCH_HITS.length);
        expect(wrapper.find('.bold').at(0).text()).toBe(TEST_SEARCH_HITS[0].label);
        expect(wrapper.find('.bold').at(1).text()).toBe(TEST_SEARCH_HITS[1].label);
        expect(wrapper.find('.col-xs-2').at(0).text()).toBe(TEST_SEARCH_HITS[0].code);
        expect(wrapper.find('.col-xs-2').at(1).text()).toBe(TEST_SEARCH_HITS[1].code);
        expect(wrapper.find('.col-xs-10')).toHaveLength(0);
        expect(wrapper.find('.col-xs-5')).toHaveLength(TEST_SEARCH_HITS.length * 2);
        expect(wrapper.find('.col-xs-5').last().text()).toBe(TEST_SEARCH_HITS[1].description);
        wrapper.unmount();
    });

    test('with searchHits, without descriptions', () => {
        const searchHits = [new ConceptModel({ code: 'a', label: 'A' })];

        const wrapper = mount(
            <OntologySearchResultsMenu {...DEFAULT_PROPS} searchHits={searchHits} totalHits={searchHits.length} />
        );
        validate(wrapper, true, searchHits.length);
        expect(wrapper.find('.col-xs-5')).toHaveLength(0);
        expect(wrapper.find('.col-xs-10')).toHaveLength(searchHits.length);
        expect(wrapper.find('.col-xs-10').text()).toBe(searchHits[0].label);
        wrapper.unmount();
    });
});
