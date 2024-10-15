import React from 'react';
import { Map } from 'immutable';

import { render } from '@testing-library/react';

import { AncestorRenderer } from './AncestorRenderer';

describe('AncestorRenderer', () => {
    test('No data', () => {
        render(<AncestorRenderer data={undefined} />);
        expect(document.querySelector('body').textContent).toBe('');
    });

    test('empty data', () => {
        render(<AncestorRenderer data={Map({})} />);
        expect(document.querySelector('body').textContent).toBe('');
    });

    test('positive value', () => {
        const data = {
            value: 123,
            displayValue: 'Sample-123',
            url: 'http://samples.org/Sample-123',
        };
        render(<AncestorRenderer data={Map(data)} />);
        expect(document.querySelectorAll('span.text-muted')).toHaveLength(0);
        const links = document.querySelectorAll('a');
        expect(links).toHaveLength(1);
        expect(links[0].getAttribute('href')).toBe(data.url);
        expect(links[0].textContent).toBe(data.displayValue);
    });

    test('negative value', () => {
        const data = {
            value: -123,
            displayValue: '123 values',
            url: undefined,
        };
        render(<AncestorRenderer data={Map(data)} />);
        const spans = document.querySelectorAll('span.text-muted');
        expect(spans).toHaveLength(1);
        expect(spans[0].getAttribute('title')).toBe('There are 123 ancestors of this type.');
        expect(spans[0].textContent).toBe('123 values');
        expect(document.querySelectorAll('.ws-pre-wrap')).toHaveLength(0);
    });
});
