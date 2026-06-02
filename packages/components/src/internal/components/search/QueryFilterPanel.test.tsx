/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Filter } from '@labkey/api';

import { ExtendedMap } from '../../../public/ExtendedMap';

import { QueryInfo } from '../../../public/QueryInfo';
import sampleSetAllFieldTypesQueryInfo from '../../../test/data/sampleSetAllFieldTypes-getQueryDetails.json';

import { getTestAPIWrapper } from '../../APIWrapper';

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
});
