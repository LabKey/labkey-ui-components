/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Filter } from '@labkey/api';

import { ExtendedMap } from '../../../public/ExtendedMap';

import { QueryInfo } from '../../../public/QueryInfo';
import sampleSetAllFieldTypesQueryInfo from '../../../test/data/sampleSetAllFieldTypes-getQueryDetails.json';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getQueryTestAPIWrapper } from '../../query/APIWrapper';

import { AssayResultDataType, SamplePropertyDataType } from '../entities/constants';

import { QueryColumn } from '../../../public/QueryColumn';

import { QueryFilterPanel } from './QueryFilterPanel';
import { EntityFieldFilter } from './models';
import { EntityDataType } from '../entities/models';

describe('QueryFilterPanel', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {}),
        filters: {},
        queryInfo: QueryInfo.fromJsonForTests(sampleSetAllFieldTypesQueryInfo, true),
        onFilterUpdate: jest.fn,
    };

    const TestAllowAllEntityType = {
        ...SamplePropertyDataType,
        supportAllValueInQuery: true,
    } as EntityDataType;

    function validate(fieldItems: number, showFilterExpression = false, showChooseValues = false): void {
        expect(document.querySelectorAll('.filter-modal__col_fields')).toHaveLength(1);
        expect(document.querySelectorAll('.filter-modal__col_filter_exp')).toHaveLength(1);
        // ChoicesListItem renders as button.list-group-item
        expect(document.querySelectorAll('button.list-group-item')).toHaveLength(fieldItems);

        const tabs = document.querySelectorAll('li[role="presentation"]');
        if (showFilterExpression) {
            expect((tabs[0] as HTMLElement).className).toBe('active');
        }
        if (showChooseValues) {
            expect((tabs[1] as HTMLElement).className).toBe('active');
        }
    }

    test('default props', () => {
        const { unmount } = render(<QueryFilterPanel {...DEFAULT_PROPS} />);
        validate(10);
        expect(document.querySelectorAll('.filter-modal__container')).toHaveLength(0);
        unmount();
    });

    test('skipDefaultViewCheck', async () => {
        render(<QueryFilterPanel {...DEFAULT_PROPS} skipDefaultViewCheck />);
        await waitFor(() => expect(document.querySelectorAll('button.list-group-item')).toHaveLength(28));
        validate(28);
    });

    test('asRow', () => {
        const { unmount } = render(<QueryFilterPanel {...DEFAULT_PROPS} asRow />);
        validate(10);
        expect(document.querySelectorAll('.field-modal__container')).toHaveLength(1);
        unmount();
    });

    test('no queryName emptyMsg', () => {
        const { unmount } = render(
            <QueryFilterPanel {...DEFAULT_PROPS} emptyMsg="Select a query" queryInfo={undefined} />
        );
        validate(0);
        expect(document.querySelectorAll('.field-modal__empty-msg')).toHaveLength(1);
        expect(document.querySelector('.field-modal__empty-msg')!.textContent).toBe('Select a query');
        unmount();
    });

    test('fullWidth', async () => {
        const { rerender, unmount } = render(<QueryFilterPanel {...DEFAULT_PROPS} />);
        validate(10);
        expect(document.querySelector('.col-sm-3')).not.toBeNull();
        expect(document.querySelector('.col-sm-6')).not.toBeNull();
        rerender(<QueryFilterPanel {...DEFAULT_PROPS} fullWidth />);
        await waitFor(() => expect(document.querySelector('.col-sm-4')).not.toBeNull());
        expect(document.querySelector('.col-sm-8')).not.toBeNull();
        unmount();
    });

    test('viewName', () => {
        const { unmount } = render(<QueryFilterPanel {...DEFAULT_PROPS} viewName="testview" />);
        validate(2);
        unmount();
    });

    test('validFilterField', () => {
        const { unmount } = render(
            <QueryFilterPanel {...DEFAULT_PROPS} validFilterField={(field, queryInfo) => field.jsonType === 'string'} />
        );
        validate(6);
        unmount();
    });

    test('one field not filterable', () => {
        const props = { ...DEFAULT_PROPS };
        let queryInfo = props.queryInfo;
        let col: QueryColumn = queryInfo.getDisplayColumns().find(field => field.jsonType === 'string');
        col = col.mutate({ filterable: false });
        const columns = new ExtendedMap<string, QueryColumn>(queryInfo.columns);
        columns.set(col.fieldKey.toLowerCase(), col);
        queryInfo = queryInfo.mutate({ columns });
        props.queryInfo = queryInfo;
        const { unmount } = render(
            <QueryFilterPanel {...props} validFilterField={(field, queryInfo) => field.jsonType === 'string'} />
        );
        validate(5);
        unmount();
    });

    test('with text activeField', () => {
        const { unmount } = render(<QueryFilterPanel {...DEFAULT_PROPS} fieldKey="Text" />);
        validate(10, false, true);
        const active = document.querySelector('.list-group-item.active');
        expect(active && active.textContent).toBe('Text');
        expect(document.querySelectorAll('.field-modal__col-sub-title')[0].textContent).toBe('Find values for Text');
        expect(document.querySelectorAll('.field-modal__empty-msg')).toHaveLength(0);
        expect(document.querySelectorAll('a[role="tab"]')).toHaveLength(2);
        expect(document.querySelectorAll('.field-modal__field_dot')).toHaveLength(0);
        unmount();
    });

    test('with non-text activeField', () => {
        const { unmount } = render(<QueryFilterPanel {...DEFAULT_PROPS} fieldKey="Integer" />);
        validate(10, true, false);
        const active = document.querySelector('.list-group-item.active');
        expect(active && active.textContent).toBe('Integer');
        expect(document.querySelector('.field-modal__col-sub-title')!.textContent).toBe('Find values for Integer');
        expect(document.querySelectorAll('.field-modal__empty-msg')).toHaveLength(0);
        expect(document.querySelectorAll('a[role="tab"]')).toHaveLength(1);
        unmount();
    });

    test('text activeField with non-equal filter', () => {
        const { unmount } = render(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                fieldKey="Text"
                filters={{
                    [DEFAULT_PROPS.queryInfo.name.toLowerCase()]: [
                        {
                            fieldKey: 'Text',
                            filter: Filter.create('Text', 'a', Filter.Types.GREATER_THAN),
                        } as EntityFieldFilter,
                    ],
                }}
            />
        );
        validate(10, true, false);
        const active = document.querySelector('.list-group-item.active');
        expect(active && active.textContent).toBe('Text');
        expect(document.querySelectorAll('.field-modal__col-sub-title')[0].textContent).toBe('Find values for Text');
        expect(document.querySelectorAll('.field-modal__empty-msg')).toHaveLength(0);
        expect(document.querySelectorAll('a[role="tab"]')).toHaveLength(2);
        expect(document.querySelectorAll('.field-modal__field_dot')).toHaveLength(1);
        unmount();
    });

    test('hasNoValueInQuery checkbox, not checked', () => {
        const hasNotInQueryFilterLabel = 'Sample Without assay data';
        const { unmount } = render(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                emptyMsg="Select a query"
                entityDataType={AssayResultDataType}
                hasNotInQueryFilterLabel={hasNotInQueryFilterLabel}
            />
        );
        validate(10);
        expect(document.querySelector('.filter-modal__fields-col-nodata-msg')!.textContent).toBe(
            hasNotInQueryFilterLabel
        );
        expect(document.querySelectorAll('.field-modal__col-content-disabled')).toHaveLength(0);

        unmount();
    });

    test('hasNoValueInQuery checkbox, checked', () => {
        const { unmount } = render(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                emptyMsg="Select a query"
                entityDataType={AssayResultDataType}
                hasNotInQueryFilter={true}
            />
        );
        validate(10);
        expect(document.querySelector('.filter-modal__fields-col-nodata-msg')!.textContent).toBe(
            'Without data from this type'
        );
        expect(document.querySelectorAll('.field-modal__col-content-disabled')).toHaveLength(1);

        unmount();
    });

    test('hasNoValueInQuery checkbox, checked, has active field and filters', () => {
        const { unmount } = render(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                emptyMsg="Select a query"
                entityDataType={AssayResultDataType}
                fieldKey="Text"
                filters={{
                    [DEFAULT_PROPS.queryInfo.name.toLowerCase()]: [
                        {
                            fieldKey: 'Text',
                            filter: Filter.create('Text', 'a', Filter.Types.GREATER_THAN),
                        } as EntityFieldFilter,
                    ],
                }}
                hasNotInQueryFilter={true}
            />
        );
        expect(document.querySelector('.filter-modal__fields-col-nodata-msg')!.textContent).toBe(
            'Without data from this type'
        );
        expect(document.querySelectorAll('.field-modal__col-content-disabled')).toHaveLength(2);

        unmount();
    });

    test('supportAllValueInQuery checkbox, not checked', () => {
        const { unmount } = render(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                allInQueryFilterLabel="All Samples"
                emptyMsg="Select a query"
                entityDataType={TestAllowAllEntityType}
            />
        );
        validate(10);
        expect(document.querySelector('.filter-modal__fields-col-any-msg')!.textContent).toBe('All Samples');
        // query by name field-value-nodata-check
        expect(document.querySelector('input[name="field-value-allvalues-check"]').getAttribute('checked')).toBe(null);
        expect(document.querySelectorAll('.field-modal__col-content-disabled')).toHaveLength(0);

        unmount();
    });

    test('supportAllValueInQuery checkbox, checked', () => {
        const { unmount } = render(
            <QueryFilterPanel
                {...DEFAULT_PROPS}
                emptyMsg="Select a query"
                entityDataType={TestAllowAllEntityType}
                hasAllValuesInQuery
            />
        );
        validate(10);
        expect(document.querySelector('.filter-modal__fields-col-any-msg')!.textContent).toBe('All data');
        expect(document.querySelector('input[name="field-value-allvalues-check"]').getAttribute('checked')).toBe('');
        expect(document.querySelectorAll('.field-modal__col-content-disabled')).toHaveLength(0);

        unmount();
    });

    test('preferFilterTabFieldKey opens the Filter tab for a facetable field', () => {
        render(<QueryFilterPanel {...DEFAULT_PROPS} fieldKey="Text" preferFilterTabFieldKey="Text" />);
        validate(10, true, false);
    });

    describe('cached facts and the default tab', () => {
        // the hook keys this map lower-cased
        const CHEAP_TEXT_FACET = {
            text: {
                fieldKey: 'Text',
                gridFieldKey: 'Text',
                hasBlank: false,
                truncated: false,
                valuesFromData: true,
                type: 'STRING' as const,
                values: ['a', 'b'],
            },
        };
        const OTHER_FIELD_FILTER = {
            [DEFAULT_PROPS.queryInfo.name.toLowerCase()]: [
                { fieldKey: 'Integer', filter: Filter.create('Integer', 1) } as EntityFieldFilter,
            ],
        };

        test('few cached values open on Choose values, even on a large grid', () => {
            render(
                <QueryFilterPanel {...DEFAULT_PROPS} columnFacets={CHEAP_TEXT_FACET} fieldKey="Text" isLargeDataset />
            );
            validate(10, false, true);
        });

        test("declared values are not the grid's values, so the column is queried like any other", async () => {
            const selectDistinctRows = jest.fn().mockResolvedValue({ values: ['a'] });
            const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { selectDistinctRows }) });
            // A Text Choice column's options arrive as values the server never read from the data
            const facets = { text: { ...CHEAP_TEXT_FACET.text, valuesFromData: false } };
            render(<QueryFilterPanel {...DEFAULT_PROPS} api={api} columnFacets={facets} fieldKey="Text" />);

            // Not cheap, so a large grid would open on Filter; this one is small, so Choose values opens and queries
            validate(10, false, true);
            await act(async () => {
                await Promise.resolve();
            });
            expect(selectDistinctRows).toHaveBeenCalledTimes(1);
        });

        const facetedValues = (): string[] =>
            Array.from(document.querySelectorAll('button.filter-faceted__value')).map(button => button.textContent);

        test('cached values are listed instead of being queried for', async () => {
            const selectDistinctRows = jest.fn().mockResolvedValue({ values: ['queried'] });
            const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { selectDistinctRows }) });
            render(<QueryFilterPanel {...DEFAULT_PROPS} api={api} columnFacets={CHEAP_TEXT_FACET} fieldKey="Text" />);

            validate(10, false, true);
            await act(async () => {
                await Promise.resolve();
            });

            expect(selectDistinctRows).not.toHaveBeenCalled();
            expect(facetedValues()).toEqual(['[All]', 'a', 'b']);
        });

        test('a cached blank is listed alongside the cached values', async () => {
            const selectDistinctRows = jest.fn().mockResolvedValue({ values: ['queried'] });
            const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { selectDistinctRows }) });
            const facets = { text: { ...CHEAP_TEXT_FACET.text, hasBlank: true } };
            render(<QueryFilterPanel {...DEFAULT_PROPS} api={api} columnFacets={facets} fieldKey="Text" />);

            await act(async () => {
                await Promise.resolve();
            });

            expect(selectDistinctRows).not.toHaveBeenCalled();
            expect(facetedValues()).toEqual(['[All]', '[blank]', 'a', 'b']);
        });

        test('a truncated cached list is missing values, so the column is queried', async () => {
            const selectDistinctRows = jest.fn().mockResolvedValue({ values: ['queried'] });
            const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { selectDistinctRows }) });
            const facets = { text: { ...CHEAP_TEXT_FACET.text, truncated: true } };
            render(<QueryFilterPanel {...DEFAULT_PROPS} api={api} columnFacets={facets} fieldKey="Text" />);

            await act(async () => {
                await Promise.resolve();
            });

            expect(selectDistinctRows).toHaveBeenCalledTimes(1);
        });

        test('declared values do not make a large grid worth opening on Choose values', () => {
            const facets = { text: { ...CHEAP_TEXT_FACET.text, valuesFromData: false } };
            render(<QueryFilterPanel {...DEFAULT_PROPS} columnFacets={facets} fieldKey="Text" isLargeDataset />);
            validate(10, true, false);
        });

        test('another field filtered puts the cached values out of date, so a large grid opens on Filter', () => {
            render(
                <QueryFilterPanel
                    {...DEFAULT_PROPS}
                    columnFacets={CHEAP_TEXT_FACET}
                    fieldKey="Text"
                    filters={OTHER_FIELD_FILTER}
                    isLargeDataset
                />
            );
            validate(10, true, false);
        });

        test('another field filtered on a small grid still opens on Choose values', () => {
            render(
                <QueryFilterPanel
                    {...DEFAULT_PROPS}
                    columnFacets={CHEAP_TEXT_FACET}
                    fieldKey="Text"
                    filters={OTHER_FIELD_FILTER}
                />
            );
            validate(10, false, true);
        });

        test('an existing equals filter opens on Filter when the list is expensive', () => {
            const facets = { text: { ...CHEAP_TEXT_FACET.text, distinctCount: 5000, values: undefined } };
            render(
                <QueryFilterPanel
                    {...DEFAULT_PROPS}
                    columnFacets={facets}
                    fieldKey="Text"
                    filters={{
                        [DEFAULT_PROPS.queryInfo.name.toLowerCase()]: [
                            { fieldKey: 'Text', filter: Filter.create('Text', 'x') } as EntityFieldFilter,
                        ],
                    }}
                />
            );
            validate(10, true, false);
        });

        test('an existing equals filter still opens on Choose values when the list is cheap', () => {
            render(
                <QueryFilterPanel
                    {...DEFAULT_PROPS}
                    columnFacets={CHEAP_TEXT_FACET}
                    fieldKey="Text"
                    filters={{
                        [DEFAULT_PROPS.queryInfo.name.toLowerCase()]: [
                            { fieldKey: 'Text', filter: Filter.create('Text', 'x') } as EntityFieldFilter,
                        ],
                    }}
                    isLargeDataset
                />
            );
            validate(10, false, true);
        });

        test('an existing equals filter opens on Filter on a large grid with no facts', () => {
            render(
                <QueryFilterPanel
                    {...DEFAULT_PROPS}
                    fieldKey="Text"
                    filters={{
                        [DEFAULT_PROPS.queryInfo.name.toLowerCase()]: [
                            { fieldKey: 'Text', filter: Filter.create('Text', 'x') } as EntityFieldFilter,
                        ],
                    }}
                    isLargeDataset
                />
            );
            validate(10, true, false);
        });

        test('nothing is queried while the first facts response is still outstanding', async () => {
            const selectDistinctRows = jest.fn().mockResolvedValue({ values: ['a'] });
            const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { selectDistinctRows }) });
            const { rerender } = render(
                <QueryFilterPanel {...DEFAULT_PROPS} api={api} columnFactsLoading fieldKey="Text" />
            );
            // No tab, because that answer decides which one opens; flush pending work before concluding nothing ran
            expect(document.querySelectorAll('li[role="presentation"]')).toHaveLength(0);
            await act(async () => {
                await Promise.resolve();
            });
            expect(selectDistinctRows).not.toHaveBeenCalled();

            // The answer carried no values for this column, so the query runs rather than waiting on later polls
            rerender(<QueryFilterPanel {...DEFAULT_PROPS} api={api} fieldKey="Text" />);
            validate(10, false, true);
            await act(async () => {
                await Promise.resolve();
            });
            expect(selectDistinctRows).toHaveBeenCalledTimes(1);
        });

        test('a large grid waits for the first facts response, then honours a cached list', () => {
            const { rerender } = render(
                <QueryFilterPanel {...DEFAULT_PROPS} columnFactsLoading fieldKey="Text" />
            );
            // No tab yet: choosing now would either run the scan or hide a list that is already cached
            expect(document.querySelectorAll('li[role="presentation"]')).toHaveLength(0);

            rerender(
                <QueryFilterPanel {...DEFAULT_PROPS} columnFacets={CHEAP_TEXT_FACET} fieldKey="Text" isLargeDataset />
            );
            validate(10, false, true);
        });

        test('a cold grid the first response reports large opens on Filter, not Choose values', () => {
            const { rerender } = render(
                <QueryFilterPanel {...DEFAULT_PROPS} columnFactsLoading fieldKey="Text" />
            );
            // Size unknown until that response: deciding here would read the grid's own count as small
            expect(document.querySelectorAll('li[role="presentation"]')).toHaveLength(0);

            // The response says the table is large and carries no values for the column yet
            rerender(<QueryFilterPanel {...DEFAULT_PROPS} fieldKey="Text" isLargeDataset />);
            validate(10, true, false);
        });

        test('a large grid with another field filtered opens on Filter and queries nothing there', async () => {
            const selectDistinctRows = jest.fn().mockResolvedValue({ values: ['a'] });
            const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { selectDistinctRows }) });
            // Cheap facts, but another field's filter means they don't describe the rows on screen
            render(
                <QueryFilterPanel
                    {...DEFAULT_PROPS}
                    api={api}
                    columnFacets={CHEAP_TEXT_FACET}
                    fieldKey="Text"
                    filters={OTHER_FIELD_FILTER}
                    isLargeDataset
                />
            );
            validate(10, true, false);

            // Opening the tab is the user's own choice, and costs what it has always cost
            await act(async () => {
                await Promise.resolve();
            });
            expect(selectDistinctRows).not.toHaveBeenCalled();
        });

        test('more cached values than the list can show opens on Filter', () => {
            const facets = {
                text: { ...CHEAP_TEXT_FACET.text, distinctCount: 5000, values: undefined },
            };
            render(<QueryFilterPanel {...DEFAULT_PROPS} columnFacets={facets} fieldKey="Text" />);
            validate(10, true, false);
        });
    });

    test('does not query distinct values until the Choose values tab is active', async () => {
        const selectDistinctRows = jest.fn().mockResolvedValue({ values: ['a', 'b'] });
        const api = getTestAPIWrapper(jest.fn, { query: getQueryTestAPIWrapper(jest.fn, { selectDistinctRows }) });

        // preferFilterTabFieldKey opens a facetable field on the Filter tab, so both tabs exist but Choose values is inactive
        render(<QueryFilterPanel {...DEFAULT_PROPS} api={api} fieldKey="Text" preferFilterTabFieldKey="Text" />);
        validate(10, true, false);
        expect(selectDistinctRows).not.toHaveBeenCalled();

        await userEvent.click(document.querySelectorAll('a[role="tab"]')[1]);
        await waitFor(() => expect(selectDistinctRows).toHaveBeenCalledTimes(1));
    });

    test('clicking a field reports it via onActiveFieldChange', async () => {
        const onActiveFieldChange = jest.fn();
        render(<QueryFilterPanel {...DEFAULT_PROPS} fieldKey="Text" onActiveFieldChange={onActiveFieldChange} />);
        expect(onActiveFieldChange).not.toHaveBeenCalled();

        const integerField = Array.from(document.querySelectorAll<HTMLElement>('button.list-group-item')).find(
            button => button.textContent === 'Integer'
        );
        await userEvent.click(integerField);
        expect(onActiveFieldChange).toHaveBeenCalledTimes(1);
        const column: QueryColumn = onActiveFieldChange.mock.calls[0][0];
        expect(column).toBeInstanceOf(QueryColumn);
        expect(column.caption).toBe('Integer');
    });
});
