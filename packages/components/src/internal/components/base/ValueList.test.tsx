import React from 'react';

import { render } from '@testing-library/react';

import { ValueList } from './ValueList';

describe('<ValueList />', () => {
    test('values.length = 2, maxCount = 3', () => {
        render(<ValueList values={['a', 'b']} maxCount={3} />);
        expect(document.querySelector('div').textContent).toBe('a, b');
    });

    test('values.length = 2, maxCount = 3, vertical', () => {
        render(<ValueList values={['a', 'b']} maxCount={3} vertical={true} />);
        expect(document.querySelectorAll('li')).toHaveLength(2);
        expect(document.querySelectorAll('li')[0].textContent).toBe('a');
        expect(document.querySelectorAll('li')[1].textContent).toBe('b');
    });

    test('values.length > 3, maxCount = 3', () => {
        render(<ValueList values={['a', 'b', 'c', 'd', 'e']} maxCount={3} />);
        expect(document.querySelector('div').textContent).toBe('a, b, c and 2 more');
    });

    test('values.length > 3, maxCount = 3, vertical', () => {
        render(<ValueList values={['a', 'b', 'c', 'd', 'e']} maxCount={3} vertical={true} />);
        expect(document.querySelectorAll('li')).toHaveLength(3);
        expect(document.querySelectorAll('li')[2].textContent).toBe('c');
        expect(document.querySelector('div').textContent).toBe('abc...');
    });
});
