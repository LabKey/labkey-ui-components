import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Filter } from '@labkey/api';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { waitForLifecycle } from '../../testHelpers';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getQueryTestAPIWrapper } from '../../query/APIWrapper';

import { FilterFacetedSelector } from './FilterFacetedSelector';

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
        },
    };
});

const valuesListShort = ['ed', 'ned', '', 'ted', 'red', 'bed'];
const allDisplayValuesShort = ['[All]', '[blank]', 'bed', 'ed', 'ned', 'red', 'ted'];
const valuesListLong = [...valuesListShort, 'hop', 'pop', 'all', 'ball', 'fall', 'wall'];
const allDisplayValuesLong = [
    '[All]',
    '[blank]',
    'all',
    'ball',
    'bed',
    'ed',
    'fall',
    'hop',
    'ned',
    'pop',
    'red',
    'ted',
    'wall',
];

const distinctValuesResp = {
    values: valuesListShort,
    schemaName: 'samples',
    queryName: 'sampleType1',
};

const distinctValuesRespLong = {
    values: valuesListLong,
    schemaName: 'samples',
    queryName: 'sampleType1',
};

const DEFAULT_PROPS = {
    api: getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            selectDistinctRows: () => Promise.resolve(distinctValuesResp),
        }),
    }),
    fieldKey: 'stringField',
    fieldFilter: null,
    selectDistinctOptions: null,
    showSearchLength: 10,
};

const DEFAULT_PROPS_LONG = {
    api: getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            selectDistinctRows: () => Promise.resolve(distinctValuesRespLong),
        }),
    }),
    fieldKey: 'stringField',
    fieldFilter: null,
    selectDistinctOptions: null,
    showSearchLength: 10,
};

describe('FilterFacetedSelector', () => {
    function validateFilterTypeDropdown(
        wrapper: ReactWrapper,
        checkedOptions: string[],
        valueTags: string[],
        allOptions?: string[],
        hasTypeAheadInput?: boolean
    ) {
        expect(wrapper.find('.find-filter-typeahead-input')).toHaveLength(hasTypeAheadInput ? 1 : 0);

        if (allOptions) {
            const valuesDivs = wrapper.find('.search-filter-values__li');

            expect(valuesDivs.length).toBe(allOptions.length);

            for (let ind = 0; ind < allOptions.length; ind++) {
                const valuesDiv = valuesDivs.at(ind);
                const value = valuesDiv.find('.search-filter-values__value').text();
                expect(value).toEqual(allOptions[ind]);

                const checkBox = valuesDiv.find('.form-check-input');
                if (checkedOptions.indexOf(allOptions[ind]) > -1) expect(checkBox.props().checked).toBeTruthy();
                else expect(checkBox.props().checked).toBeFalsy();
            }
        }

        if (valueTags) {
            const valuesTagDivs = wrapper.find('.search-filter-tags__value');
            expect(valuesTagDivs.length).toBe(valueTags.length);
            for (let ind = 0; ind < valueTags.length; ind++) {
                const tagDiv = valuesTagDivs.at(ind);
                expect(tagDiv.text()).toEqual(valueTags[ind]);
            }
        }
    }

    test('with no initial filter', async () => {
        const wrapper = mount(<FilterFacetedSelector {...DEFAULT_PROPS} />);

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validateFilterTypeDropdown(wrapper, allDisplayValuesShort, [], allDisplayValuesShort, false);

        wrapper.unmount();
    });

    test('with eq filter', async () => {
        const wrapper = mount(
            <FilterFacetedSelector {...DEFAULT_PROPS} fieldFilter={Filter.create('stringField', 'ed')} />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validateFilterTypeDropdown(wrapper, ['ed'], ['ed'], allDisplayValuesShort, false);

        wrapper.unmount();
    });

    test('with is blank filter', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS}
                fieldFilter={Filter.create('stringField', null, Filter.Types.ISBLANK)}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validateFilterTypeDropdown(wrapper, ['[blank]'], ['[blank]'], allDisplayValuesShort, false);

        wrapper.unmount();
    });

    test('with not eq filter', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS}
                fieldFilter={Filter.create('stringField', 'ed', Filter.Types.NOT_EQUAL)}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validateFilterTypeDropdown(
            wrapper,
            ['[blank]', 'bed', 'ned', 'red', 'ted'],
            ['[blank]', 'bed', 'ned', 'red', 'ted'],
            allDisplayValuesShort,
            false
        );

        wrapper.unmount();
    });

    test('with is not blank filter', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS}
                fieldFilter={Filter.create('stringField', null, Filter.Types.NONBLANK)}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validateFilterTypeDropdown(
            wrapper,
            ['bed', 'ed', 'ned', 'red', 'ted'],
            ['bed', 'ed', 'ned', 'red', 'ted'],
            allDisplayValuesShort,
            false
        );

        wrapper.unmount();
    });

    test('with in filter', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS}
                fieldFilter={Filter.create('stringField', 'ed;ned', Filter.Types.IN)}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validateFilterTypeDropdown(wrapper, ['ed', 'ned'], ['ed', 'ned'], allDisplayValuesShort, false);

        wrapper.unmount();
    });

    test('with not in filter', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS}
                fieldFilter={Filter.create('stringField', 'ed;ned', Filter.Types.NOT_IN)}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validateFilterTypeDropdown(
            wrapper,
            ['[blank]', 'bed', 'red', 'ted'],
            ['[blank]', 'bed', 'red', 'ted'],
            allDisplayValuesShort,
            false
        );

        wrapper.unmount();
    });

    test('with type ahead input', async () => {
        const wrapper = mount(<FilterFacetedSelector {...DEFAULT_PROPS_LONG} />);

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validateFilterTypeDropdown(wrapper, allDisplayValuesLong, [], allDisplayValuesLong, true);

        wrapper.unmount();
    });

    test('set type ahead input value', async () => {
        const wrapper = mount(<FilterFacetedSelector {...DEFAULT_PROPS_LONG} />);

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        wrapper
            .find('input#find-filter-typeahead-input')
            .simulate('focus')
            .simulate('change', {
                target: {
                    value: 'op',
                },
            });

        await waitForLifecycle(wrapper);

        validateFilterTypeDropdown(wrapper, ['hop', 'pop'], [], ['hop', 'pop'], true);

        wrapper.unmount();
    });

    test('set type ahead input value, with tagged values', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS_LONG}
                fieldFilter={Filter.create('stringField', 'ed;ned', Filter.Types.IN)}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        wrapper
            .find('input#find-filter-typeahead-input')
            .simulate('focus')
            .simulate('change', {
                target: {
                    value: 'op',
                },
            });

        await waitForLifecycle(wrapper);

        validateFilterTypeDropdown(wrapper, ['ed', 'ned'], ['ed', 'ned'], ['ed', 'hop', 'ned', 'pop'], true);

        wrapper.unmount();
    });
});
