import React from 'react';
import { render } from '@testing-library/react';

import { HorizontalBarSection } from './HorizontalBarSection';

describe('HorizontalBarSection', () => {
    test('no data', () => {
        render(<HorizontalBarSection title="Test Allocation" subtitle="A description" data={[]} />);

        expect(document.querySelector('.horizontal-bar--title').textContent).toBe('Test Allocation');
        expect(document.querySelector('.horizontal-bar--subtitle').textContent).toBe('A description');
        expect(document.querySelectorAll('.horizontal-bar-part')).toHaveLength(0);
    });

    test('with data', () => {
        const allocationData = [
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
        render(
            <HorizontalBarSection title="Test Allocation" subtitle="A description" data={allocationData} />
        );

        expect(document.querySelector('.horizontal-bar--title').textContent).toBe('Test Allocation');
        expect(document.querySelector('.horizontal-bar--subtitle').textContent).toBe('A description');
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
});
