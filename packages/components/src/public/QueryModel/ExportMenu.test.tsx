import React from 'react';
import { render } from '@testing-library/react';
import { Set as ImmutableSet } from 'immutable';

import userEvent from '@testing-library/user-event';

import { SchemaQuery } from '../SchemaQuery';

import { EXPORT_TYPES } from '../../internal/constants';

import { QueryModel } from './QueryModel';
import { ExportMenu } from './ExportMenu';

describe('ExportMenu', () => {
    const MODEL = new QueryModel({ schemaQuery: new SchemaQuery('Schema', 'Query') }).mutate({
        orderedRows: ['0', '1'],
        rows: {
            '0': {
                RowId: { value: 0 },
                Data: { value: 100 },
            },
            '1': {
                RowId: { value: 1 },
                Data: { values: 200 },
            },
        },
    });

    test('default', () => {
        const exportFn = jest.fn();
        const onExport = { [EXPORT_TYPES.CSV]: exportFn };

        render(<ExportMenu model={MODEL} onExport={onExport} />);

        expect(document.querySelector('[role="heading"]').innerHTML).toBe('Export Data');
        expect(document.querySelectorAll('.export-menu-icon').length).toBe(3);
        userEvent.click(document.querySelector('[role="menuitem"]'));
        expect(exportFn).toHaveBeenCalledTimes(1);
    });

    test('with selection', () => {
        const model = MODEL.mutate({
            selections: new Set(['1']),
        });
        const exportFn = jest.fn();
        const onExport = { [EXPORT_TYPES.CSV]: exportFn };

        render(<ExportMenu model={model} onExport={onExport} />);

        expect(document.querySelector('[role="heading"]').innerHTML).toBe('Export Selected Data');
    });

    test('supported types', () => {
        const exportFn = jest.fn();
        const onExport = { [EXPORT_TYPES.STORAGE_MAP]: exportFn };
        const supportedTypes = ImmutableSet.of(EXPORT_TYPES.STORAGE_MAP);

        render(<ExportMenu model={MODEL} onExport={onExport} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(4);
        userEvent.click(document.querySelectorAll('[role="menuitem"]')[3]);
        expect(exportFn).toHaveBeenCalledTimes(1);
    });

    test('supported types, can print template, but not label', () => {
        const supportedTypes = ImmutableSet.of(EXPORT_TYPES.LABEL_TEMPLATE);

        render(<ExportMenu model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(4);
        expect(document.querySelectorAll('.divider').length).toBe(1);
    });

    test('supported types, can print label, but not template', () => {
        const supportedTypes = ImmutableSet.of(EXPORT_TYPES.LABEL);

        render(<ExportMenu model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(4);
        expect(document.querySelectorAll('.divider').length).toBe(1);
    });

    test('supported types, can print label and template', () => {
        const supportedTypes = ImmutableSet.of(EXPORT_TYPES.LABEL, EXPORT_TYPES.LABEL_TEMPLATE);

        render(<ExportMenu model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(5);
        expect(document.querySelectorAll('.divider').length).toBe(1);
    });

    test('supported types: all', () => {
        const supportedTypes = ImmutableSet.of(
            EXPORT_TYPES.LABEL,
            EXPORT_TYPES.LABEL_TEMPLATE,
            EXPORT_TYPES.STORAGE_MAP
        );

        render(<ExportMenu model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(6);
        expect(document.querySelectorAll('.divider').length).toBe(2);
    });
});
