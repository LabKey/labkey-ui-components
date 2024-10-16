import React from 'react';

import { render } from '@testing-library/react';

import { ColorIcon } from './ColorIcon';

describe('ColorIcon', () => {
    function verifyIconDisplay(rgbColor: string, label?: string): void {
        expect(document.querySelectorAll('i')).toHaveLength(1);
        const icon = document.querySelectorAll('i')[0];
        expect(icon.getAttribute('style')).toBe('background-color: ' + rgbColor + ';');

        const spans = document.querySelectorAll('span');
        if (label) {
            expect(spans).toHaveLength(1);
            expect(spans[0].textContent).toBe(label);
        } else {
            expect(spans).toHaveLength(0);
        }
    }

    test('value prop', () => {
        const color = '#000000';
        render(<ColorIcon value={color} />);
        expect(document.querySelectorAll('i')).toHaveLength(1);
        verifyIconDisplay('rgb(0, 0, 0)');
    });

    test('asSquare prop', () => {
        const color = '#ffffff';
        render(<ColorIcon value={color} asSquare />);
        verifyIconDisplay('rgb(255, 255, 255)');
    });

    test('with label prop', () => {
        const color = '#ffffff';
        const label = 'Color Label';
        render(<ColorIcon value={color} label={label} />);
        verifyIconDisplay('rgb(255, 255, 255)', label);
    });
});
