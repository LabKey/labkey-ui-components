/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { LineageFilter } from './types';
import { LineageSettings } from './LineageSettings';

describe('LineageSettings', () => {
    test('onFilterChange', async () => {
        const filter = new LineageFilter('type', ['Awesome']);
        const filter2 = new LineageFilter('lsid', ['lsid:value:1']);
        const onSettingsChange = jest.fn();

        render(<LineageSettings filters={[filter, filter2]} onSettingsChange={onSettingsChange} />);

        const typeCheckbox = screen.getByRole('checkbox', { name: /type/i });
        expect(typeCheckbox).toBeInTheDocument();

        // Uncheck type filter
        fireEvent.click(typeCheckbox);

        // Simulate the second uncheck (which shouldn't affect state since it's already unchecked)
        fireEvent.click(typeCheckbox);

        // Find and uncheck lsid filter
        const lsidCheckbox = screen.getByRole('checkbox', { name: /lsid/i });
        fireEvent.click(lsidCheckbox);

        // Wait for the first batch of changes
        await waitFor(() => {
            expect(onSettingsChange).toHaveBeenCalledWith({
                filters: [filter],
                originalFilters: [filter, filter2],
            });
        });

        expect(onSettingsChange).toHaveBeenCalledTimes(1);
    });
});
