/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { HorizontalBarSection } from './HorizontalBarSection';
import { HorizontalBarData } from './utils';

describe('HorizontalBarSection', () => {
    test('no data', () => {
        render(<HorizontalBarSection title="Test Allocation" subtitle="A description" data={[]} />);

        expect(document.querySelector('.horizontal-bar--title')).toHaveTextContent('Test Allocation');
        expect(document.querySelector('.horizontal-bar--subtitle')).toHaveTextContent('A description');
        expect(document.querySelectorAll('.horizontal-bar-part')).toHaveLength(0);
    });

    // Issue 52587: Empty tooltip content when data has a count of zero
    test('with data no count', async () => {
        const expectedTitle = "2 'Sample Type 1' samples";
        const noCountData: HorizontalBarData[] = [
            {
                title: expectedTitle,
                count: 0,
                totalCount: 10,
                percent: 20,
                backgroundColor: 'blue',
                href: '#/freezers/test/storageView?query.SampleType~eq=Sample Type 1&query.StorageStatus~eq=Checked out',
                filled: true,
            },
        ];
        render(<HorizontalBarSection title="Test Allocation" subtitle="A description" data={noCountData} />);

        expect(document.querySelector('.horizontal-bar--title')).toHaveTextContent('Test Allocation');
        expect(document.querySelector('.horizontal-bar--subtitle')).toHaveTextContent('A description');
        expect(document.querySelectorAll('.horizontal-bar-part')).toHaveLength(1);

        await userEvent.hover(document.querySelector('.horizontal-bar-part'));

        await waitFor(() => {
            expect(document.querySelector('.popover-content')).toBeInTheDocument();
        });
        expect(document.querySelector('.popover-content')).toHaveTextContent(expectedTitle);
    });

    test('with data', () => {
        const allocationData: HorizontalBarData[] = [
            {
                title: "2 'Sample Type 1' samples",
                count: 2,
                totalCount: 10,
                percent: 20,
                backgroundColor: 'blue',
                href: '#/freezers/test/storageView?query.SampleType~eq=Sample Type 1&query.StorageStatus~eq=Checked out',
                filled: true,
            },
            {
                title: "3 'Sample Type 4' samples",
                count: 3,
                totalCount: 10,
                percent: 30,
                backgroundColor: 'orange',
                href: '#/freezers/test/storageView?query.SampleType~eq=Sample Type 4&query.StorageStatus~eq=Checked out',
                filled: true,
            },
            {
                title: '5 samples not checked out',
                count: 5,
                totalCount: 10,
                percent: 50,
                filled: false,
            },
        ];
        render(<HorizontalBarSection title="Test Allocation" subtitle="A description" data={allocationData} />);

        expect(document.querySelector('.horizontal-bar--title')).toHaveTextContent('Test Allocation');
        expect(document.querySelector('.horizontal-bar--subtitle')).toHaveTextContent('A description');
        expect(document.querySelectorAll('.horizontal-bar-part')).toHaveLength(3);
        expect(document.querySelectorAll('.horizontal-bar--linked')).toHaveLength(2);
        expect(document.querySelectorAll('.horizontal-bar--open')).toHaveLength(1);

        const parts = document.querySelectorAll('.horizontal-bar-part');
        expect(parts).toHaveLength(3);
        expect(parts[0].getAttribute('class')).toContain('horizontal-bar--linked');
        expect(parts[0].parentElement.getAttribute('style')).toBe('width: 20%; background: blue;');
        expect(parts[1].getAttribute('class')).toContain('horizontal-bar--linked');
        expect(parts[1].parentElement.getAttribute('style')).toBe('width: 30%; background: orange;');
        expect(parts[2].getAttribute('class')).toContain('horizontal-bar--open');
        expect(parts[2].parentElement.getAttribute('style')).toBe('width: 50%;');
    });

    // section headers offset the legend rows from the bars, so the hovered bar must be matched by barIndex
    test('summary tooltip highlights the hovered bar across section headers', async () => {
        const sectioned: HorizontalBarData[] = [
            { title: 'red', name: 'Red', sectionLabel: 'Blood', count: 12, totalCount: 40, percent: 30, filled: true },
            { title: 'blue', name: 'Blue', sectionLabel: 'Blood', count: 8, totalCount: 40, percent: 20, filled: true },
            {
                title: 'plasma',
                name: 'No Color',
                sectionLabel: 'Plasma',
                count: 20,
                totalCount: 40,
                percent: 50,
                filled: true,
                unlabeled: true,
            },
        ];
        render(<HorizontalBarSection data={sectioned} showSummaryTooltip />);

        // legend is: [Blood header, Red, Blue, Plasma] -- hovering the 2nd bar must bold the 3rd legend row
        await userEvent.hover(document.querySelectorAll('.horizontal-bar-part')[1]);
        await waitFor(() => {
            expect(document.querySelector('.popover-content')).toBeInTheDocument();
        });

        const labels = document.querySelectorAll('.popover-content .cell-legend-label');
        expect(labels).toHaveLength(3);
        expect(document.querySelectorAll('.popover-content .cell-legend-section')).toHaveLength(1);
        expect(labels[1]).toHaveTextContent('Blue');
        expect(labels[1].getAttribute('class')).toContain('bold-text');
        expect(document.querySelectorAll('.popover-content .bold-text')).toHaveLength(1);
    });
});
