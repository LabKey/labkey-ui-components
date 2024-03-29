import React from 'react';
import { render } from '@testing-library/react';

import { ManageDropdownButton } from './ManageDropdownButton';

describe('ManageDropdownButton', () => {
    test('default props', () => {
        render(<ManageDropdownButton />);

        expect(document.querySelector('.dropdown-toggle').textContent).toBe('Manage');
        expect(document.querySelector('.dropdown-toggle').getAttribute('disabled')).toBeNull();
        expect(document.querySelectorAll('.fa-bars')).toHaveLength(1);
    });

    test('showIcon false', () => {
        render(<ManageDropdownButton showIcon={false} />);

        expect(document.querySelector('.dropdown-toggle').textContent).toBe('Manage');
        expect(document.querySelector('.dropdown-toggle').getAttribute('disabled')).toBeNull();
        expect(document.querySelectorAll('.fa-bars')).toHaveLength(0);
    });

    test('disabled', () => {
        render(<ManageDropdownButton disabled />);

        expect(document.querySelector('.dropdown-toggle').textContent).toBe('Manage');
        expect(document.querySelector('.dropdown-toggle').getAttribute('disabled')).toBe('');
        expect(document.querySelectorAll('.fa-bars')).toHaveLength(1);
    });
});
