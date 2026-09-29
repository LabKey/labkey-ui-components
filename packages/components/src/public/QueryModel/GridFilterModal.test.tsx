/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Filter } from '@labkey/api';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { QueryColumn } from '../QueryColumn';
import { getTestAPIWrapper } from '../../internal/APIWrapper';

import { makeTestQueryModel } from './testUtils';
import { GridFilterModal } from './GridFilterModal';

describe('GridFilterModal', () => {
    const DEFAULT_PROPS = {
        api: getTestAPIWrapper(jest.fn, {}),
        initFilters: [],
        model: makeTestQueryModel(
            new SchemaQuery('schema', 'query', 'view'),
            QueryInfo.fromJsonForTests({ name: 'Query', schema: 'schema', title: 'Query Title' })
        ),
        onApply: jest.fn,
        onCancel: jest.fn,
    };

    test('default props', () => {
        render(<GridFilterModal {...DEFAULT_PROPS} />);
        expect(document.querySelector('.modal-title').textContent).toBe('Filter Query Title');
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.filter-modal__col_fields')).toHaveLength(1);
        expect(document.querySelectorAll('button')).toHaveLength(3); // 2 in footer + close icon
        expect(document.querySelectorAll('button')[1].hasAttribute('disabled')).toBe(false); // cancel
        expect(document.querySelectorAll('button')[1].hasAttribute('disabled')).toBe(false); // apply
    });

    describe('initialDraft', () => {
        const FIELDS = [
            new QueryColumn({ caption: 'Tube Type', fieldKey: 'TubeType', jsonType: 'string', name: 'TubeType' }),
            new QueryColumn({ caption: 'Blood Type', fieldKey: 'BloodType', jsonType: 'string', name: 'BloodType' }),
        ];
        const DRAFT = { ops: { BloodType: 'contains', TubeType: 'contains' }, value: 'Sod' };

        const valueInput = (): HTMLInputElement => document.querySelector('input[aria-label="Filter 0 value 1"]');
        const fieldButton = (caption: string): HTMLElement =>
            Array.from(document.querySelectorAll<HTMLElement>('button.list-group-item')).find(
                button => button.textContent === caption
            );
        const applyButton = (): HTMLElement =>
            Array.from(document.querySelectorAll<HTMLElement>('.modal-footer button')).find(
                button => button.textContent === 'Apply'
            );
        const appliedFilters = (onApply: jest.Mock): string[] =>
            onApply.mock.calls[0][0].map(
                (f: Filter.IFilter) => `${f.getColumnName()}~${f.getFilterType().getURLSuffix()}=${f.getValue()}`
            );

        test('seeds the first field and lists only the given fields', async () => {
            const onApply = jest.fn();
            render(
                <GridFilterModal
                    {...DEFAULT_PROPS}
                    fieldKey="TubeType"
                    fields={FIELDS}
                    initialDraft={DRAFT}
                    onApply={onApply}
                />
            );

            expect(document.querySelectorAll('button.list-group-item')).toHaveLength(2);
            expect(valueInput().value).toBe('Sod');

            await userEvent.click(applyButton());
            expect(appliedFilters(onApply)).toEqual(['TubeType~contains=Sod']);
        });

        test('the unedited draft follows the active field', async () => {
            const onApply = jest.fn();
            render(
                <GridFilterModal
                    {...DEFAULT_PROPS}
                    fieldKey="TubeType"
                    fields={FIELDS}
                    initialDraft={DRAFT}
                    onApply={onApply}
                />
            );

            await userEvent.click(fieldButton('Blood Type'));
            expect(valueInput().value).toBe('Sod');

            await userEvent.click(applyButton());
            expect(appliedFilters(onApply)).toEqual(['BloodType~contains=Sod']);
        });

        test('an edited draft stays on its field', async () => {
            const onApply = jest.fn();
            render(
                <GridFilterModal
                    {...DEFAULT_PROPS}
                    fieldKey="TubeType"
                    fields={FIELDS}
                    initialDraft={DRAFT}
                    onApply={onApply}
                />
            );

            await userEvent.type(valueInput(), 'ium');
            await userEvent.click(fieldButton('Blood Type'));
            expect(valueInput().value).toBe('');

            await userEvent.click(applyButton());
            expect(appliedFilters(onApply)).toEqual(['TubeType~contains=Sodium']);
        });

        test('a field that already has a filter is not seeded', async () => {
            const onApply = jest.fn();
            render(
                <GridFilterModal
                    {...DEFAULT_PROPS}
                    fieldKey="TubeType"
                    fields={FIELDS}
                    initFilters={[Filter.create('BloodType', 'A+')]}
                    initialDraft={DRAFT}
                    onApply={onApply}
                />
            );

            await userEvent.click(fieldButton('Blood Type'));
            expect(valueInput().value).toBe('A+');

            await userEvent.click(applyButton());
            expect(appliedFilters(onApply)).toEqual(['BloodType~eq=A+']);
        });
    });
});
