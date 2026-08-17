/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { getTestAPIWrapper } from '../../APIWrapper';
import { getQueryTestAPIWrapper, QueryAPIWrapper } from '../../query/APIWrapper';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { getSamplesTestAPIWrapper, SamplesAPIWrapper } from './APIWrapper';
import { SampleColorModel } from './models';
import { ManageSampleColorsPanel } from './ManageSampleColorsPanel';

const makeColor = (rowId: number, label: string, color: string, archived = false): SampleColorModel => ({
    rowId,
    label,
    color,
    archived,
});

const renderPanel = (
    colors: SampleColorModel[],
    samplesOverrides: Partial<SamplesAPIWrapper> = {},
    queryOverrides: Partial<QueryAPIWrapper> = {}
) => {
    const query = getQueryTestAPIWrapper(jest.fn, {
        insertRows: jest.fn().mockResolvedValue({}),
        updateRows: jest.fn().mockResolvedValue({}),
        deleteRows: jest.fn().mockResolvedValue({}),
        // DataTypeSelector (the "Sample Types" picker) loads the type list through this.
        getFolderConfigurableEntityTypeOptions: jest.fn().mockResolvedValue([]),
        getFolderDataTypeDataCount: jest.fn().mockResolvedValue({}),
        ...queryOverrides,
    });
    const samples = getSamplesTestAPIWrapper(jest.fn, {
        // fresh row objects per call, like the real action, so a reload re-renders the detail panel
        getSampleColors: jest.fn().mockImplementation(() => Promise.resolve(colors.map(c => ({ ...c })))),
        getColorSampleTypeExclusions: jest.fn().mockResolvedValue([]),
        updateColorSettings: jest.fn().mockResolvedValue(1),
        ...samplesOverrides,
    });
    const result = renderWithAppContext(
        <ManageSampleColorsPanel getIsDirty={jest.fn().mockReturnValue(false)} setIsDirty={jest.fn()} />,
        { appContext: { api: getTestAPIWrapper(jest.fn, { query, samples }) } }
    );
    return { ...result, query, samples };
};

const TYPE_A = { rowId: 10, label: 'Sample Type A' } as any;
const TYPE_B = { rowId: 11, label: 'Sample Type B' } as any;

describe('ManageSampleColorsPanel', () => {
    test('splits colors into active and an expandable archived section', async () => {
        renderPanel([makeColor(1, 'Red', '#ff0000'), makeColor(2, 'Gray', '#888888', true)]);

        // active color shows immediately; archived color is hidden until the section is expanded
        await screen.findByRole('button', { name: 'Red' });
        expect(screen.queryByRole('button', { name: 'Gray' })).not.toBeInTheDocument();

        const toggle = screen.getByRole('button', { name: /Archived Colors/ });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');

        await userEvent.click(toggle);

        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('button', { name: 'Gray' })).toBeInTheDocument();
    });

    test('disables adding a color once the max limit is reached', async () => {
        const colors = Array.from({ length: 200 }, (_, i) => makeColor(i + 1, `Color ${i + 1}`, '#111111'));
        renderPanel(colors);
        const addButton = await screen.findByRole('button', { name: /Add Color/i });
        // ActionButton applies a `disabled` class (not the DOM attribute) and drops its onClick when disabled.
        expect(addButton.className).toContain('disabled');
    });

    test('adding a color below the limit opens an empty detail form with Save disabled until valid', async () => {
        renderPanel([makeColor(1, 'Red', '#ff0000')]);
        await screen.findByRole('button', { name: 'Red' });

        const addButton = screen.getByRole('button', { name: /Add Color/i });
        expect(addButton.className).not.toContain('disabled');
        await userEvent.click(addButton);

        expect(screen.getByPlaceholderText('Enter color label')).toHaveValue('');
        // canSave requires both a label and a color, so a brand-new color starts non-savable.
        expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('archiving a color saves it (via the settings action) with the archived flag flipped', async () => {
        const { samples } = renderPanel([makeColor(1, 'Red', '#ff0000')]);
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        await userEvent.click(screen.getByRole('button', { name: 'Archive' }));

        await waitFor(() => expect(samples.updateColorSettings).toHaveBeenCalledTimes(1));
        expect(samples.updateColorSettings).toHaveBeenCalledWith(
            expect.objectContaining({ rowId: 1, label: 'Red', archived: true }),
            [],
            [],
            undefined
        );
    });

    test('deleting a color calls deleteRows after confirmation', async () => {
        const { query } = renderPanel([makeColor(1, 'Red', '#ff0000')]);
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
        await userEvent.click(screen.getByRole('button', { name: 'Yes, Delete' }));

        await waitFor(() => expect(query.deleteRows).toHaveBeenCalledTimes(1));
        const options = (query.deleteRows as jest.Mock).mock.calls[0][0];
        expect(options.rows[0]).toMatchObject({ rowId: 1 });
    });

    test('blocks navigating to other colors when there are unsaved edits', async () => {
        renderPanel([makeColor(1, 'Red', '#ff0000'), makeColor(2, 'Blue', '#0000ff')]);
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        // both list items are clickable before any edit
        expect(screen.getByRole('button', { name: 'Blue' })).toBeEnabled();

        // editing the label marks the panel dirty
        await userEvent.type(screen.getByPlaceholderText('Enter color label'), 'X');

        // the other color becomes unclickable; the color being edited stays selectable
        expect(screen.getByRole('button', { name: 'Blue' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Red' })).toBeEnabled();
        // and the "New Color" button is disabled too (AddEntityButton uses a disabled class rather than the attribute)
        expect(screen.getByRole('button', { name: /Color/ })).toHaveClass('disabled');
    });

    test('limits the label input to the max length (64)', async () => {
        renderPanel([makeColor(1, 'Red', '#ff0000')]);
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        expect(screen.getByPlaceholderText('Enter color label')).toHaveAttribute('maxlength', '64');
    });

    test('disables Delete for a color that is in use', async () => {
        const { query } = renderPanel([{ ...makeColor(1, 'Red', '#ff0000'), inUse: true }]);
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        const deleteButton = screen.getByRole('button', { name: 'Delete' });
        expect(deleteButton).toBeDisabled();

        // clicking a disabled button is a no-op: no confirmation modal is shown and deleteRows is never called
        await userEvent.click(deleteButton);
        expect(screen.queryByRole('button', { name: 'Yes, Delete' })).not.toBeInTheDocument();
        expect(query.deleteRows).not.toHaveBeenCalled();
    });

    test('shows an error when the colors query fails', async () => {
        renderPanel([], { getSampleColors: jest.fn().mockRejectedValue(new Error('boom')) });
        expect(await screen.findByText('Error: Unable to load sample colors.')).toBeInTheDocument();
    });

    const withTypes = (...types: any[]) => ({
        getFolderConfigurableEntityTypeOptions: jest.fn().mockResolvedValue(types),
    });

    test('selecting a color loads its sample types with all enabled (checked) by default', async () => {
        renderPanel(
            [makeColor(1, 'Red', '#ff0000')],
            { getColorSampleTypeExclusions: jest.fn().mockResolvedValue([]) },
            withTypes(TYPE_A, TYPE_B)
        );
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        expect(await screen.findByRole('checkbox', { name: 'Sample Type A' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Sample Type B' })).toBeChecked();
    });

    test('an existing exclusion shows that sample type unchecked', async () => {
        renderPanel(
            [makeColor(1, 'Red', '#ff0000')],
            { getColorSampleTypeExclusions: jest.fn().mockResolvedValue([TYPE_B.rowId]) },
            withTypes(TYPE_A, TYPE_B)
        );
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        expect(await screen.findByRole('checkbox', { name: 'Sample Type A' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Sample Type B' })).not.toBeChecked();
    });

    test('unchecking a sample type and saving folds the exclusion into the color save', async () => {
        const { samples } = renderPanel(
            [makeColor(1, 'Red', '#ff0000')],
            { getColorSampleTypeExclusions: jest.fn().mockResolvedValue([]) },
            withTypes(TYPE_A, TYPE_B)
        );
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        await userEvent.click(await screen.findByRole('checkbox', { name: 'Sample Type A' }));
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(samples.updateColorSettings).toHaveBeenCalledTimes(1));
        // TYPE_A was enabled and is now unchecked -> newly disabled; nothing newly enabled.
        expect(samples.updateColorSettings).toHaveBeenCalledWith(
            expect.objectContaining({ rowId: 1 }),
            [TYPE_A.rowId],
            [],
            undefined
        );
    });

    test('re-enabling a previously excluded sample type sends it as newly enabled on save', async () => {
        const { samples } = renderPanel(
            [makeColor(1, 'Red', '#ff0000')],
            { getColorSampleTypeExclusions: jest.fn().mockResolvedValue([TYPE_B.rowId]) },
            withTypes(TYPE_A, TYPE_B)
        );
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        // TYPE_B starts excluded (unchecked); checking it re-enables it.
        await userEvent.click(await screen.findByRole('checkbox', { name: 'Sample Type B' }));
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(samples.updateColorSettings).toHaveBeenCalledTimes(1));
        expect(samples.updateColorSettings).toHaveBeenCalledWith(
            expect.objectContaining({ rowId: 1 }),
            [],
            [TYPE_B.rowId],
            undefined
        );
    });

    test('"Deselect All" excludes every sample type on save', async () => {
        const { samples } = renderPanel(
            [makeColor(1, 'Red', '#ff0000')],
            { getColorSampleTypeExclusions: jest.fn().mockResolvedValue([]) },
            withTypes(TYPE_A, TYPE_B)
        );
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        await userEvent.click(await screen.findByRole('button', { name: 'Deselect All' }));
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(samples.updateColorSettings).toHaveBeenCalledTimes(1));
        expect(samples.updateColorSettings).toHaveBeenCalledWith(
            expect.objectContaining({ rowId: 1 }),
            [TYPE_A.rowId, TYPE_B.rowId],
            [],
            undefined
        );
    });

    test('"Select All" re-enables every excluded sample type on save', async () => {
        const { samples } = renderPanel(
            [makeColor(1, 'Red', '#ff0000')],
            { getColorSampleTypeExclusions: jest.fn().mockResolvedValue([TYPE_A.rowId, TYPE_B.rowId]) },
            withTypes(TYPE_A, TYPE_B)
        );
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        await userEvent.click(await screen.findByRole('button', { name: 'Select All' }));
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(samples.updateColorSettings).toHaveBeenCalledTimes(1));
        expect(samples.updateColorSettings).toHaveBeenCalledWith(
            expect.objectContaining({ rowId: 1 }),
            [],
            [TYPE_A.rowId, TYPE_B.rowId],
            undefined
        );
    });

    test('a new color shows the sample-type section with everything enabled', async () => {
        renderPanel([makeColor(1, 'Red', '#ff0000')], {}, withTypes(TYPE_A, TYPE_B));
        await userEvent.click(await screen.findByRole('button', { name: /Add Color/i }));

        // The section is available while creating a color, so it can be created with exclusions.
        expect(await screen.findByRole('checkbox', { name: 'Sample Type A' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Sample Type B' })).toBeChecked();
    });

    test('adding a color after viewing one with exclusions starts with everything enabled', async () => {
        renderPanel(
            [makeColor(1, 'Red', '#ff0000')],
            { getColorSampleTypeExclusions: jest.fn().mockResolvedValue([TYPE_B.rowId]) },
            withTypes(TYPE_A, TYPE_B)
        );
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));
        expect(await screen.findByRole('checkbox', { name: 'Sample Type B' })).not.toBeChecked();

        await userEvent.click(screen.getByRole('button', { name: /Add Color/i }));

        expect(await screen.findByRole('checkbox', { name: 'Sample Type A' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'Sample Type B' })).toBeChecked();
    });

    test('archiving carries pending sample-type edits instead of discarding them', async () => {
        const { samples } = renderPanel(
            [makeColor(1, 'Red', '#ff0000')],
            { getColorSampleTypeExclusions: jest.fn().mockResolvedValue([]) },
            withTypes(TYPE_A, TYPE_B)
        );
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        await userEvent.click(await screen.findByRole('checkbox', { name: 'Sample Type A' }));
        await userEvent.click(screen.getByRole('button', { name: 'Archive' }));

        await waitFor(() => expect(samples.updateColorSettings).toHaveBeenCalledTimes(1));
        expect(samples.updateColorSettings).toHaveBeenCalledWith(
            expect.objectContaining({ rowId: 1, archived: true }),
            [TYPE_A.rowId],
            [],
            undefined
        );
    });

    test('re-reads exclusions after a save so the next delta is relative to what was stored', async () => {
        const getExclusions = jest
            .fn()
            .mockResolvedValueOnce([]) // initial load: nothing excluded
            .mockResolvedValue([TYPE_A.rowId]); // reload after the save: TYPE_A is now excluded
        const { samples } = renderPanel(
            [makeColor(1, 'Red', '#ff0000')],
            { getColorSampleTypeExclusions: getExclusions },
            withTypes(TYPE_A, TYPE_B)
        );
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        await userEvent.click(await screen.findByRole('checkbox', { name: 'Sample Type A' }));
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(samples.updateColorSettings).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(getExclusions).toHaveBeenCalledTimes(2));
        expect(await screen.findByRole('checkbox', { name: 'Sample Type A' })).not.toBeChecked();

        await userEvent.click(screen.getByRole('checkbox', { name: 'Sample Type B' }));
        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        // TYPE_A was already stored as excluded, so only TYPE_B is newly disabled.
        await waitFor(() => expect(samples.updateColorSettings).toHaveBeenCalledTimes(2));
        expect(samples.updateColorSettings).toHaveBeenLastCalledWith(
            expect.objectContaining({ rowId: 1 }),
            [TYPE_B.rowId],
            [],
            undefined
        );
    });

    test('sample-type checkboxes are read-only (and no Select All) for an archived color', async () => {
        renderPanel(
            [makeColor(1, 'Gray', '#888888', true)],
            { getColorSampleTypeExclusions: jest.fn().mockResolvedValue([]) },
            withTypes(TYPE_A, TYPE_B)
        );
        // archived colors live behind the collapsible Archived Colors section
        await userEvent.click(await screen.findByRole('button', { name: /Archived Colors/ }));
        await userEvent.click(screen.getByRole('button', { name: 'Gray' }));

        expect(await screen.findByRole('checkbox', { name: 'Sample Type A' })).toBeDisabled();
        expect(screen.getByRole('checkbox', { name: 'Sample Type B' })).toBeDisabled();
        expect(screen.queryByRole('button', { name: /Select All|Deselect All/ })).not.toBeInTheDocument();
    });
});
