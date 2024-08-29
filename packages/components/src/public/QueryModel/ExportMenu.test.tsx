import React from 'react';
import { render } from '@testing-library/react';
import { Set as ImmutableSet } from 'immutable';

import { userEvent } from '@testing-library/user-event';

import { SchemaQuery } from '../SchemaQuery';

import { EXPORT_TYPES } from '../../internal/constants';

import { QueryInfo } from '../QueryInfo';

import { ExportMenu } from './ExportMenu';
import { makeTestActions, makeTestQueryModel } from './testUtils';

describe('ExportMenu', () => {
    const ACTIONS = makeTestActions(jest.fn);
    const MODEL = makeTestQueryModel(
        new SchemaQuery('Schema', 'Query'),
        new QueryInfo({}),
        {
            '0': {
                RowId: { value: 0 },
                Data: { value: 100 },
            },
            '1': {
                RowId: { value: 1 },
                Data: { values: 200 },
            },
        },
        ['0', '1'],
        2
    );

    test('default', async () => {
        const exportFn = jest.fn();
        const onExport = { [EXPORT_TYPES.CSV]: exportFn };

        render(<ExportMenu actions={ACTIONS} model={MODEL} onExport={onExport} />);

        expect(document.querySelector('[role="heading"]').innerHTML).toBe('Export Data');
        expect(document.querySelectorAll('.export-menu-icon').length).toBe(3);
        await userEvent.click(document.querySelector('[role="menuitem"]'));
        expect(exportFn).toHaveBeenCalledTimes(1);
        expect(ACTIONS.addMessage).toHaveBeenCalledTimes(0); // not called directly for onExport override
    });

    test('addMessage on export', () => {
        render(<ExportMenu actions={ACTIONS} model={MODEL} />);
        expect(document.querySelector('[role="heading"]').innerHTML).toBe('Export Data');
        expect(document.querySelectorAll('.export-menu-icon').length).toBe(3);
        userEvent.click(document.querySelector('[role="menuitem"]'));
        expect(ACTIONS.addMessage).toHaveBeenCalledTimes(1);
        expect(ACTIONS.addMessage).toHaveBeenCalledWith(
            'model',
            { content: 'CSV export started.', type: 'success' },
            5000
        );
    });

    test('with selection', () => {
        const model = MODEL.mutate({
            selections: new Set(['1']),
        });
        const exportFn = jest.fn();
        const onExport = { [EXPORT_TYPES.CSV]: exportFn };

        render(<ExportMenu actions={ACTIONS} model={model} onExport={onExport} />);

        expect(document.querySelector('[role="heading"]').innerHTML).toBe('Export Selected Data');
    });

    test('supported types', async () => {
        const exportFn = jest.fn();
        const onExport = { [EXPORT_TYPES.STORAGE_MAP]: exportFn };
        const supportedTypes = ImmutableSet.of(EXPORT_TYPES.STORAGE_MAP);

        render(<ExportMenu actions={ACTIONS} model={MODEL} onExport={onExport} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(4);
        await userEvent.click(document.querySelectorAll('[role="menuitem"]')[3]);
        expect(exportFn).toHaveBeenCalledTimes(1);
    });

    test('supported types, can print template, but not label', () => {
        const supportedTypes = ImmutableSet.of(EXPORT_TYPES.LABEL_TEMPLATE);

        render(<ExportMenu actions={ACTIONS} model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(4);
        expect(document.querySelectorAll('.divider').length).toBe(1);
    });

    test('supported types, can print label, but not template', () => {
        const supportedTypes = ImmutableSet.of(EXPORT_TYPES.LABEL);

        render(<ExportMenu actions={ACTIONS} model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(4);
        expect(document.querySelectorAll('.divider').length).toBe(1);
    });

    test('supported types, can print label and template', () => {
        const supportedTypes = ImmutableSet.of(EXPORT_TYPES.LABEL, EXPORT_TYPES.LABEL_TEMPLATE);

        render(<ExportMenu actions={ACTIONS} model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(5);
        expect(document.querySelectorAll('.divider').length).toBe(1);
    });

    test('supported types: all', () => {
        const supportedTypes = ImmutableSet.of(
            EXPORT_TYPES.LABEL,
            EXPORT_TYPES.LABEL_TEMPLATE,
            EXPORT_TYPES.STORAGE_MAP
        );

        render(<ExportMenu actions={ACTIONS} model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(6);
        expect(document.querySelectorAll('.divider').length).toBe(2);
    });
});
