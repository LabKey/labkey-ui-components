import React, { act } from 'react';

import { Filter } from '@labkey/api';

import { render } from '@testing-library/react';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getQueryTestAPIWrapper } from '../../query/APIWrapper';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { FilterFacetedSelector } from './FilterFacetedSelector';
import {QueryColumn} from "../../../public/QueryColumn";
import {MULTI_CHOICE_TYPE} from "../domainproperties/PropDescType";
import {naturalSort} from "../../../public/sort";

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

const distinctValuesWithoutBlankResp = {
    values: ['ed', 'ned', 'ted', 'red', 'bed'],
    schemaName: 'samples',
    queryName: 'sampleType1',
};

const largeValues = Array(251).fill('x');
const largeValuesDisplay = ['[blank]', ...largeValues.slice(1)];

const largeValuesWithoutBlankResp = {
    values: largeValues, // not distinct, but not required to be for the usage
    schemaName: 'samples',
    queryName: 'sampleType1',
};

const DEFAULT_PROPS = {
    api: getTestAPIWrapper(jest.fn, {
        query: getQueryTestAPIWrapper(jest.fn, {
            selectDistinctRows: jest.fn().mockResolvedValue(distinctValuesResp),
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
            selectDistinctRows: options => {
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

const mvtcField = new QueryColumn({
    caption: 'Multi Value String Field',
    fieldKey: 'stringField',
    jsonType: 'ARRAY',
    rangeURI: MULTI_CHOICE_TYPE.rangeURI,
    validValues: ['a', 'ab', 'cc', 'cD', 'A,B', 'de'],
});

describe('FilterFacetedSelector', () => {
    function validate(
        checkedOptions: string[],
        valueTags: string[],
        allOptions?: string[],
        hasTypeAheadInput?: boolean
    ): void {
        expect(document.querySelectorAll('.filter-faceted__typeahead-input')).toHaveLength(hasTypeAheadInput ? 1 : 0);

        if (allOptions) {
            const valuesDivs = document.querySelectorAll('.filter-faceted__li');

            expect(valuesDivs.length).toBe(allOptions.length);

            for (let ind = 0; ind < allOptions.length; ind++) {
                const valuesDiv = valuesDivs.item(ind);
                const value = valuesDiv.querySelector('.filter-faceted__value').textContent;
                expect(value).toEqual(allOptions[ind]);

                const checkBox = valuesDiv.querySelector('.form-check-input');
                if (checkedOptions.indexOf(allOptions[ind]) > -1) {
                    expect(checkBox.getAttribute('checked')).not.toBeNull();
                } else {
                    expect(checkBox.getAttribute('checked')).toBeNull();
                }
            }
        }

        if (valueTags) {
            const valuesTagDivs = document.querySelectorAll('.filter-status-value');
            expect(valuesTagDivs.length).toBe(valueTags.length);
            for (let ind = 0; ind < valueTags.length; ind++) {
                const tagDiv = valuesTagDivs.item(ind);
                expect(tagDiv.textContent).toEqual(valueTags[ind]);
            }
        }
    }

    test('with no initial filter', async () => {
        await act(async () => {
            render(<FilterFacetedSelector {...DEFAULT_PROPS} />);
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate(allDisplayValuesShort, [], allDisplayValuesShort, false);
    });

    test('is Folder field', async () => {
        await act(async () => {
            renderWithAppContext(<FilterFacetedSelector {...DEFAULT_PROPS} fieldKey="folder" />, {
                serverContext: {
                    moduleContext: {
                        samplemanagement: {
                            archivedContainers: ['ned', 'red'],
                        },
                    },
                },
            });
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();

        const options = ['[All]', '[blank]', 'bed', 'ed', 'nedArchived', 'redArchived', 'ted'];
        validate(options, [], options, false);
    });

    test('with no initial filter, not blank', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...{
                        ...DEFAULT_PROPS,
                        api: getTestAPIWrapper(jest.fn, {
                            query: getQueryTestAPIWrapper(jest.fn, {
                                selectDistinctRows: jest.fn().mockResolvedValue(distinctValuesWithoutBlankResp),
                            }),
                        }),
                        canBeBlank: false,
                    }}
                />
            );
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate(allWithoutBlankDisplayValuesShort, [], allWithoutBlankDisplayValuesShort, false);
    });

    test('with no initial filter, many values, can be blank', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...{
                        ...DEFAULT_PROPS,
                        api: getTestAPIWrapper(jest.fn, {
                            query: getQueryTestAPIWrapper(jest.fn, {
                                selectDistinctRows: jest.fn().mockResolvedValue(largeValuesWithoutBlankResp),
                            }),
                        }),
                    }}
                />
            );
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate([], [], largeValuesDisplay, true);
    });

    test('with eq filter', async () => {
        await act(async () => {
            render(<FilterFacetedSelector {...DEFAULT_PROPS} fieldFilters={[Filter.create('stringField', 'ed')]} />);
        });
        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate(['ed'], ['ed'], allDisplayValuesShort, false);
    });

    test('with is blank filter', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...DEFAULT_PROPS}
                    fieldFilters={[Filter.create('stringField', null, Filter.Types.ISBLANK)]}
                />
            );
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate(['[blank]'], ['[blank]'], allDisplayValuesShort, false);
    });

    test('with not eq filter', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...DEFAULT_PROPS}
                    fieldFilters={[Filter.create('stringField', 'ed', Filter.Types.NOT_EQUAL)]}
                />
            );
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate(
            ['[blank]', 'bed', 'ned', 'red', 'ted'],
            ['[blank]', 'bed', 'ned', 'red', 'ted'],
            allDisplayValuesShort,
            false
        );
    });

    test('with is not blank filter', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...DEFAULT_PROPS}
                    fieldFilters={[Filter.create('stringField', null, Filter.Types.NONBLANK)]}
                />
            );
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate(['bed', 'ed', 'ned', 'red', 'ted'], ['bed', 'ed', 'ned', 'red', 'ted'], allDisplayValuesShort, false);
    });

    test('with in filter', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...DEFAULT_PROPS}
                    fieldFilters={[Filter.create('stringField', 'ed;ned', Filter.Types.IN)]}
                />
            );
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();
        expect(document.querySelectorAll('.filter-expression__input-select')).toHaveLength(0);
        validate(['ed', 'ned'], ['ed', 'ned'], allDisplayValuesShort, false);
    });

    test('with not in filter', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...DEFAULT_PROPS}
                    fieldFilters={[Filter.create('stringField', 'ed;ned', Filter.Types.NOT_IN)]}
                />
            );
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate(['[blank]', 'bed', 'red', 'ted'], ['[blank]', 'bed', 'red', 'ted'], allDisplayValuesShort, false);
    });

    test('with multiple filters, first is supported', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...DEFAULT_PROPS}
                    fieldFilters={[
                        Filter.create('stringField', 'ed;ned', Filter.Types.NOT_IN),
                        Filter.create('stringField', 'bed', Filter.Types.GT),
                    ]}
                />
            );
        });
        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate(['[blank]', 'bed', 'red', 'ted'], ['[blank]', 'bed', 'red', 'ted'], allDisplayValuesShort, false);
    });

    test('with multiple filters, first is not supported', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...DEFAULT_PROPS}
                    fieldFilters={[
                        Filter.create('stringField', 'bed', Filter.Types.GT),
                        Filter.create('stringField', 'ed;ned', Filter.Types.NOT_IN),
                    ]}
                />
            );
        });
        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate([], [], allDisplayValuesShort, false);
    });

    test('with type ahead input', async () => {
        await act(async () => {
            render(<FilterFacetedSelector {...DEFAULT_PROPS_LONG} />);
        });
        expect(document.querySelector('.fa-spinner')).toBeNull();

        validate(allDisplayValuesLong, [], allDisplayValuesLong, true);
    });

    test('multi choice field, no filter', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...DEFAULT_PROPS}
                    field={mvtcField}
                />
            );
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();

        expect(document.querySelectorAll('.filter-expression__input-select')).toHaveLength(1);
        expect(document.querySelector('div.select-input__single-value').textContent).toBe("Contains All");

        validate([], [], ['[All]', ...mvtcField.validValues].sort(naturalSort), false);
    });

    test('multi choice field, with filter to some values', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...DEFAULT_PROPS}
                    field={mvtcField}
                    fieldFilters={[
                        Filter.create('stringField', ['bed', 'red'], Filter.Types.ARRAY_CONTAINS_ALL),
                    ]}
                />
            );
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();
        expect(document.querySelectorAll('.filter-expression__input-select')).toHaveLength(1);
        expect(document.querySelector('div.select-input__single-value').textContent).toBe("Contains All");

        validate(['bed', 'red'], ['bed', 'red'], ['[All]', ...mvtcField.validValues].sort(naturalSort), false);
    });

    test('multi choice field, with filter to all values', async () => {
        await act(async () => {
            render(
                <FilterFacetedSelector
                    {...DEFAULT_PROPS}
                    field={mvtcField}
                    fieldFilters={[
                        Filter.create('stringField', mvtcField.validValues, Filter.Types.ARRAY_CONTAINS_NONE),
                    ]}
                />
            );
        });

        expect(document.querySelector('.fa-spinner')).toBeNull();

        expect(document.querySelector('div.select-input__single-value').textContent).toBe("Contains None");

        validate(['[All]', ...mvtcField.validValues], [], ['[All]', ...mvtcField.validValues].sort(naturalSort), false);
    });
});
