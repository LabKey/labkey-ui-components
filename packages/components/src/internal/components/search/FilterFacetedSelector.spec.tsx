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
const allWithoutBlankDisplayValuesShort = ['[All]', 'bed', 'ed', 'ned', 'red', 'ted'];
const valuesListLong = [...valuesListShort, 'hop', '1', 'pop', 'all', 'ball', 'fall', 'wall'];
const allDisplayValuesLong = [
    '[All]',
    '[blank]',
    '1',
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

const distinctValuesRespSearch = {
    values: ['hop', 'pop'],
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
    fieldFilters: null,
    selectDistinctOptions: null,
    showSearchLength: 10,
    canBeBlank: true,
};

const DEFAULT_PROPS_LONG = {
    api: getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            selectDistinctRows: (options) => {
                if (options.filterArray?.[0]) return Promise.resolve(distinctValuesRespSearch);
                return Promise.resolve(distinctValuesRespLong);
            },
        }),
    }),
    fieldKey: 'stringField',
    fieldFilters: null,
    selectDistinctOptions: null,
    showSearchLength: 10,
    canBeBlank: true,
};

describe('FilterFacetedSelector', () => {
    function validate(
        wrapper: ReactWrapper,
        checkedOptions: string[],
        valueTags: string[],
        allOptions?: string[],
        hasTypeAheadInput?: boolean
    ) {
        expect(wrapper.find('.filter-faceted__typeahead-input')).toHaveLength(hasTypeAheadInput ? 1 : 0);

        if (allOptions) {
            const valuesDivs = wrapper.find('.filter-faceted__li');

            expect(valuesDivs.length).toBe(allOptions.length);

            for (let ind = 0; ind < allOptions.length; ind++) {
                const valuesDiv = valuesDivs.at(ind);
                const value = valuesDiv.find('.filter-faceted__value').text();
                expect(value).toEqual(allOptions[ind]);

                const checkBox = valuesDiv.find('.form-check-input');
                if (checkedOptions.indexOf(allOptions[ind]) > -1) {
                    expect(checkBox.props().checked).toBeTruthy();
                }
                else {
                    expect(checkBox.props().checked).toBeFalsy();
                }
            }
        }

        if (valueTags) {
            const valuesTagDivs = wrapper.find('.filter-status-value');
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

        validate(wrapper, allDisplayValuesShort, [], allDisplayValuesShort, false);

        wrapper.unmount();
    });

    test('with no initial filter, not blank', async () => {
        const wrapper = mount(<FilterFacetedSelector {...{...DEFAULT_PROPS, canBeBlank: false}}/>);

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validate(wrapper, allWithoutBlankDisplayValuesShort, [],  allWithoutBlankDisplayValuesShort, false);

        wrapper.unmount();
    });

    test('with eq filter', async () => {
        const wrapper = mount(
            <FilterFacetedSelector {...DEFAULT_PROPS} fieldFilters={[Filter.create('stringField', 'ed')]} />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validate(wrapper, ['ed'], ['ed'], allDisplayValuesShort, false);

        wrapper.unmount();
    });

    test('with is blank filter', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS}
                fieldFilters={[Filter.create('stringField', null, Filter.Types.ISBLANK)]}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validate(wrapper, ['[blank]'], ['[blank]'], allDisplayValuesShort, false);

        wrapper.unmount();
    });

    test('with not eq filter', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS}
                fieldFilters={[Filter.create('stringField', 'ed', Filter.Types.NOT_EQUAL)]}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validate(
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
                fieldFilters={[Filter.create('stringField', null, Filter.Types.NONBLANK)]}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validate(
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
                fieldFilters={[Filter.create('stringField', 'ed;ned', Filter.Types.IN)]}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validate(wrapper, ['ed', 'ned'], ['ed', 'ned'], allDisplayValuesShort, false);

        wrapper.unmount();
    });

    test('with not in filter', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS}
                fieldFilters={[Filter.create('stringField', 'ed;ned', Filter.Types.NOT_IN)]}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validate(
            wrapper,
            ['[blank]', 'bed', 'red', 'ted'],
            ['[blank]', 'bed', 'red', 'ted'],
            allDisplayValuesShort,
            false
        );

        wrapper.unmount();
    });

    test('with multiple filters, first is supported', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS}
                fieldFilters={[
                    Filter.create('stringField', 'ed;ned', Filter.Types.NOT_IN),
                    Filter.create('stringField', 'bed', Filter.Types.GT),
                ]}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validate(
            wrapper,
            ['[blank]', 'bed', 'red', 'ted'],
            ['[blank]', 'bed', 'red', 'ted'],
            allDisplayValuesShort,
            false
        );

        wrapper.unmount();
    });

    test('with multiple filters, first is not supported', async () => {
        const wrapper = mount(
            <FilterFacetedSelector
                {...DEFAULT_PROPS}
                fieldFilters={[
                    Filter.create('stringField', 'bed', Filter.Types.GT),
                    Filter.create('stringField', 'ed;ned', Filter.Types.NOT_IN),
                ]}
            />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validate(wrapper, [], [], allDisplayValuesShort, false);

        wrapper.unmount();
    });

    test('with type ahead input', async () => {
        const wrapper = mount(<FilterFacetedSelector {...DEFAULT_PROPS_LONG} />);

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        validate(wrapper, allDisplayValuesLong, [], allDisplayValuesLong, true);

        wrapper.unmount();
    });

    test('set type ahead input value', async () => {
        const wrapper = mount(<FilterFacetedSelector {...DEFAULT_PROPS_LONG} />);

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        wrapper
            .find('input#filter-faceted__typeahead-input')
            .simulate('focus')
            .simulate('change', {
                target: {
                    value: 'op',
                },
            });

        await waitForLifecycle(wrapper);

        validate(wrapper, ['hop', 'pop'], [], ['hop', 'pop'], true);

        wrapper.unmount();
    });
});
