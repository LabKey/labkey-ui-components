import React from 'react';
import { render } from '@testing-library/react';

import { SearchBox } from './SearchBox';

describe('SearchBox', () => {
    test('with Find', () => {
        const { container } = render(<SearchBox onSearch={jest.fn} onFindByIds={jest.fn} findNounPlural="Items" />);
        expect(container.querySelectorAll('.lk-dropdown.btn-group')).toHaveLength(1);
        const menuItems = container.querySelectorAll('.lk-menu-item');
        expect(menuItems).toHaveLength(3);
        expect(menuItems[0].textContent.trim()).toBe('Find Items by Barcode');
        expect(menuItems[1].textContent.trim()).toBe('Find Items by ID');
        expect(menuItems[2].textContent.trim()).toBe('Sample Finder');
    });

    test('without Find', () => {
        const { container } = render(<SearchBox onSearch={jest.fn} placeholder="Seek wisdom" />);
        expect(container.querySelectorAll('.lk-dropdown.btn-group')).toHaveLength(0);
        const inputs = container.querySelectorAll('input');
        expect(inputs).toHaveLength(1);
        expect((inputs[0] as HTMLInputElement).placeholder).toBe('Seek wisdom');
    });
});
