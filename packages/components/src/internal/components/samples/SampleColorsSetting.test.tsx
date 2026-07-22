/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { getTestAPIWrapper } from '../../APIWrapper';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR } from '../../userFixtures';

import { getSamplesTestAPIWrapper } from './APIWrapper';
import { SampleColorModel } from './models';
import { SampleColorsSetting } from './SampleColorsSetting';

const makeColor = (rowId: number): SampleColorModel => ({
    rowId,
    label: `Color ${rowId}`,
    color: '#123456',
    archived: false,
});

const renderSetting = (
    colors: SampleColorModel[],
    excluded: number[] = [],
    props: Partial<React.ComponentProps<typeof SampleColorsSetting>> = {},
    user = TEST_USER_APP_ADMIN
) => {
    const appContext = {
        api: getTestAPIWrapper(jest.fn, {
            samples: getSamplesTestAPIWrapper(jest.fn, {
                getSampleColors: jest.fn().mockResolvedValue(colors),
                getSampleTypeColorExclusions: jest.fn().mockResolvedValue(excluded),
            }),
        }),
    };
    return renderWithAppContext(
        <SampleColorsSetting sampleTypeRowId={1} onChange={jest.fn()} {...props} />,
        { appContext, serverContext: { user } }
    );
};

describe('SampleColorsSetting', () => {
    test('shows a loading spinner until colors resolve', async () => {
        const { container } = renderSetting([]);
        expect(container.querySelectorAll('.fa-spinner')).toHaveLength(1);
        await waitFor(() => expect(container.querySelectorAll('.fa-spinner')).toHaveLength(0));
    });

    test('empty state shows the "Add Colors" link only for an app admin', async () => {
        renderSetting([], [], {}, TEST_USER_APP_ADMIN);
        await waitFor(() => expect(screen.getByText('No colors are set up yet.')).toBeInTheDocument());
        expect(screen.getByRole('link', { name: 'Add Colors' })).toBeInTheDocument();
    });

    test('empty state hides the "Add Colors" link for a non-app-admin', async () => {
        renderSetting([], [], {}, TEST_USER_EDITOR);
        await waitFor(() => expect(screen.getByText('No colors are set up yet.')).toBeInTheDocument());
        expect(screen.queryByRole('link', { name: 'Add Colors' })).not.toBeInTheDocument();
    });

    test('renders a dot per enabled color with an accurate count', async () => {
        const { container } = renderSetting([makeColor(1), makeColor(2), makeColor(3)]);
        await waitFor(() => expect(screen.getByText('3 colors enabled.')).toBeInTheDocument());
        expect(container.querySelectorAll('.sample-colors-setting__dot')).toHaveLength(3);
        expect(container.querySelectorAll('.sample-colors-setting__dot-more')).toHaveLength(0);
    });

    test('saved exclusions are excluded from the enabled count and dots', async () => {
        const { container } = renderSetting([makeColor(1), makeColor(2), makeColor(3)], [2, 3]);
        await waitFor(() => expect(screen.getByText('1 colors enabled.')).toBeInTheDocument());
        expect(container.querySelectorAll('.sample-colors-setting__dot')).toHaveLength(1);
    });

    test('caps the preview at MAX_DOTS and shows the "+" more indicator when over the cap', async () => {
        const colors = Array.from({ length: 25 }, (_, i) => makeColor(i + 1));
        const { container } = renderSetting(colors);
        await waitFor(() => expect(screen.getByText('25 colors enabled.')).toBeInTheDocument());
        // 25 > MAX_DOTS (20): exactly 20 dots render, and the last one is the "+" more indicator.
        expect(container.querySelectorAll('.sample-colors-setting__dot')).toHaveLength(20);
        const more = container.querySelectorAll('.sample-colors-setting__dot-more');
        expect(more).toHaveLength(1);
        expect(more.item(0).textContent).toBe('+');
    });

    test('editing colors and applying reports the new disabled set via onChange', async () => {
        const onChange = jest.fn();
        renderSetting([makeColor(1), makeColor(2)], [], { onChange });
        await waitFor(() => expect(screen.getByText('2 colors enabled.')).toBeInTheDocument());

        await userEvent.click(screen.getByRole('button', { name: 'Edit' }));

        // All colors start enabled (checked); unchecking the first disables rowId 1.
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(2);
        await userEvent.click(checkboxes[0]);

        await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
        expect(onChange).toHaveBeenCalledWith([1]);
    });

    test('shows an error when the colors query fails', async () => {
        const appContext = {
            api: getTestAPIWrapper(jest.fn, {
                samples: getSamplesTestAPIWrapper(jest.fn, {
                    getSampleColors: jest.fn().mockRejectedValue(new Error('boom')),
                    getSampleTypeColorExclusions: jest.fn().mockResolvedValue([]),
                }),
            }),
        };
        renderWithAppContext(<SampleColorsSetting sampleTypeRowId={1} onChange={jest.fn()} />, {
            appContext,
            serverContext: { user: TEST_USER_APP_ADMIN },
        });
        await waitFor(() => expect(screen.getByText('Unable to load sample colors.')).toBeInTheDocument());
    });
});
