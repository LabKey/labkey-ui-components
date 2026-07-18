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
        ...queryOverrides,
    });
    const samples = getSamplesTestAPIWrapper(jest.fn, {
        getSampleColors: jest.fn().mockResolvedValue(colors),
        ...samplesOverrides,
    });
    const result = renderWithAppContext(
        <ManageSampleColorsPanel getIsDirty={jest.fn().mockReturnValue(false)} setIsDirty={jest.fn()} />,
        { appContext: { api: getTestAPIWrapper(jest.fn, { query, samples }) } }
    );
    return { ...result, query };
};

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

    test('archiving a color updates it with the archived flag flipped', async () => {
        const { query } = renderPanel([makeColor(1, 'Red', '#ff0000')]);
        await userEvent.click(await screen.findByRole('button', { name: 'Red' }));

        await userEvent.click(screen.getByRole('button', { name: 'Archive' }));

        await waitFor(() => expect(query.updateRows).toHaveBeenCalledTimes(1));
        const options = (query.updateRows as jest.Mock).mock.calls[0][0];
        expect(options.rows[0]).toMatchObject({ rowId: 1, label: 'Red', archived: true });
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

    test('shows an error when the colors query fails', async () => {
        renderPanel([], { getSampleColors: jest.fn().mockRejectedValue(new Error('boom')) });
        expect(await screen.findByText('Error: Unable to load sample colors.')).toBeInTheDocument();
    });
});
