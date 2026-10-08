/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { SchemaQuery } from '../SchemaQuery';

import { EXPORT_TYPES, ExportHeaderTypes } from '../../internal/constants';

import { ExportMenu } from './ExportMenu';
import { makeTestActions, makeTestQueryModel } from './testUtils';
import { makeQueryInfo } from '../../internal/test/testHelpers';
import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';

const QUERY_INFO = makeQueryInfo(mixturesQueryInfo);

describe('ExportMenu', () => {
    const ACTIONS = makeTestActions(jest.fn);
    const MODEL = makeTestQueryModel(
        new SchemaQuery('Schema', 'Query'),
        QUERY_INFO,
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

    const getHeadings = (): string[] =>
        Array.from(document.querySelectorAll('[role="heading"]')).map(
            heading => heading.querySelector('span:not(.sr-only)').textContent
        );

    test('default', async () => {
        const exportFn = jest.fn();
        const onExport = { [EXPORT_TYPES.CSV]: exportFn };

        render(<ExportMenu actions={ACTIONS} exportRows={jest.fn()} model={MODEL} onExport={onExport} />);

        expect(getHeadings()).toEqual(['Grid View Labels', 'Field Names']);
        expect(Array.from(document.querySelectorAll('[role="heading"] .sr-only')).map(el => el.textContent)).toEqual([
            "Uses this view's field labels, which may not be recognized during import.",
            'Uses database field names, which work better for import.',
        ]);
        expect(document.querySelectorAll('[role="heading"] .fa-question-circle[aria-hidden="true"]').length).toBe(2);
        expect(document.querySelectorAll('.export-menu-icon').length).toBe(6);
        expect(document.querySelectorAll('.divider').length).toBe(1);
        await userEvent.click(document.querySelector('[role="menuitem"]'));
        expect(exportFn).toHaveBeenCalledTimes(1);
        expect(ACTIONS.addMessage).toHaveBeenCalledTimes(0); // not called directly for onExport override
    });

    test('addMessage on export', async () => {
        render(<ExportMenu actions={ACTIONS} exportRows={jest.fn()} model={MODEL} />);
        await userEvent.click(document.querySelector('[role="menuitem"]'));
        expect(ACTIONS.addMessage).toHaveBeenCalledTimes(1);
        expect(ACTIONS.addMessage).toHaveBeenCalledWith(
            'model',
            { content: 'CSV export started.', type: 'success' },
            5000
        );
    });

    test('exports with option header type', async () => {
        const exportRows = jest.fn();
        render(<ExportMenu actions={ACTIONS} exportRows={exportRows} model={MODEL} />);

        const menuItems = document.querySelectorAll('[role="menuitem"]');
        await userEvent.click(menuItems[0]);
        expect(exportRows).toHaveBeenLastCalledWith(
            EXPORT_TYPES.CSV,
            expect.objectContaining({ headerType: ExportHeaderTypes.Caption }),
            undefined
        );

        await userEvent.click(menuItems[3]);
        expect(exportRows).toHaveBeenLastCalledWith(
            EXPORT_TYPES.CSV,
            expect.objectContaining({ headerType: ExportHeaderTypes.ImportField }),
            undefined
        );
    });

    test('onExport override receives option header type', async () => {
        const exportFn = jest.fn();
        const onExport = { [EXPORT_TYPES.EXCEL]: exportFn };
        render(<ExportMenu actions={ACTIONS} exportRows={jest.fn()} model={MODEL} onExport={onExport} />);

        const menuItems = document.querySelectorAll('[role="menuitem"]');
        await userEvent.click(menuItems[1]);
        expect(exportFn).toHaveBeenLastCalledWith('model', ExportHeaderTypes.Caption);

        await userEvent.click(menuItems[4]);
        expect(exportFn).toHaveBeenLastCalledWith('model', ExportHeaderTypes.ImportField);
    });

    test('single supported header type', () => {
        const supportedHeaderTypes = new Set([ExportHeaderTypes.ImportField]);

        render(
            <ExportMenu
                actions={ACTIONS}
                exportRows={jest.fn()}
                model={MODEL}
                supportedHeaderTypes={supportedHeaderTypes}
            />
        );

        expect(getHeadings()).toEqual([]);
        expect(document.querySelectorAll('.export-menu-icon').length).toBe(3);
        expect(document.querySelectorAll('.divider').length).toBe(0);
    });

    test('without selection', async () => {
        render(<ExportMenu actions={ACTIONS} exportRows={jest.fn()} model={MODEL} />);

        await userEvent.hover(document.querySelector('.export-menu button'));
        expect(await screen.findByText('Export All Data')).toBeInTheDocument();
    });

    test('with selection', async () => {
        const model = MODEL.mutate({
            selections: new Set(['1']),
        });
        const exportFn = jest.fn();
        const onExport = { [EXPORT_TYPES.CSV]: exportFn };

        render(<ExportMenu actions={ACTIONS} exportRows={jest.fn()} model={model} onExport={onExport} />);

        await userEvent.hover(document.querySelector('.export-menu button'));
        expect(await screen.findByText('Export Selected Data')).toBeInTheDocument();
    });

    test('supported types', async () => {
        const exportFn = jest.fn();
        const onExport = { [EXPORT_TYPES.STORAGE_MAP]: exportFn };
        const supportedTypes = new Set([EXPORT_TYPES.STORAGE_MAP]);

        render(
            <ExportMenu
                actions={ACTIONS}
                exportRows={jest.fn()}
                model={MODEL}
                onExport={onExport}
                supportedTypes={supportedTypes}
            />
        );

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(7);
        await userEvent.click(document.querySelectorAll('[role="menuitem"]')[6]);
        expect(exportFn).toHaveBeenCalledTimes(1);
    });

    test('supported types, can print template, but not label', () => {
        const supportedTypes = new Set([EXPORT_TYPES.LABEL_TEMPLATE]);

        render(<ExportMenu actions={ACTIONS} exportRows={jest.fn()} model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(7);
        expect(document.querySelectorAll('.divider').length).toBe(2);
    });

    test('supported types, can print label, but not template', () => {
        const supportedTypes = new Set([EXPORT_TYPES.LABEL]);

        render(<ExportMenu actions={ACTIONS} exportRows={jest.fn()} model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(7);
        expect(document.querySelectorAll('.divider').length).toBe(2);
    });

    test('supported types, can print label and template', () => {
        const supportedTypes = new Set([EXPORT_TYPES.LABEL, EXPORT_TYPES.LABEL_TEMPLATE]);

        render(<ExportMenu actions={ACTIONS} exportRows={jest.fn()} model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(8);
        expect(document.querySelectorAll('.divider').length).toBe(2);
    });

    test('supported types: all', () => {
        const supportedTypes = new Set([EXPORT_TYPES.LABEL, EXPORT_TYPES.LABEL_TEMPLATE, EXPORT_TYPES.STORAGE_MAP]);

        render(<ExportMenu actions={ACTIONS} exportRows={jest.fn()} model={MODEL} supportedTypes={supportedTypes} />);

        expect(document.querySelectorAll('.export-menu-icon').length).toBe(9);
        expect(document.querySelectorAll('.divider').length).toBe(3);
    });
});
