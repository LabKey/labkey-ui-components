import React from 'react';

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { AddRowsControl } from './Controls';

describe('Controls', () => {
    test('default properties', async () => {
        const addFn = jest.fn();
        render(<AddRowsControl onAdd={addFn} />);
        await userEvent.click(document.querySelector('button'));
        expect(addFn).toHaveBeenCalledTimes(1);
    });

    test('non-default properties', async () => {
        const addFn = jest.fn();
        render(<AddRowsControl initialCount={6} maxCount={25} minCount={5} onAdd={addFn} />);
        const inputWrapper = document.querySelector('input');
        expect(inputWrapper.getAttribute('value')).toBe('6');
        expect(inputWrapper.getAttribute('min')).toBe('5');
        expect(inputWrapper.getAttribute('max')).toBe('25');
        await userEvent.type(inputWrapper, '1');
        expect(document.querySelectorAll('.text-danger')).toHaveLength(1);
        expect(document.querySelector('.text-danger').textContent).toBe(
            'At most 25 rows can be added at once (25 remaining).'
        );
    });

    test('invalid row count', async () => {
        const addFn = jest.fn();
        render(<AddRowsControl initialCount={6} maxCount={10} onAdd={addFn} />);
        const inputWrapper = document.querySelector('input');
        await userEvent.type(inputWrapper, '100');
        expect(document.querySelectorAll('.text-danger')).toHaveLength(1);
        expect(document.querySelector('.text-danger').textContent).toBe(
            'At most 10 rows can be added at once (10 remaining).'
        );
    });

    test('invalid row count with custom invalidCountMsg', async () => {
        const addFn = jest.fn();
        render(
            <AddRowsControl
                initialCount={6}
                maxCount={10}
                onAdd={addFn}
                invalidCountMsg="A max of 10 rows are allowed"
            />
        );
        const inputWrapper = document.querySelector('input');
        await userEvent.type(inputWrapper, '100');

        expect(document.querySelectorAll('.text-danger')).toHaveLength(1);
        expect(document.querySelector('.text-danger').textContent).toContain('A max of 10 rows are allowed');
    });

    test('invalid row count with maxTotalCount', async () => {
        const addFn = jest.fn();
        render(<AddRowsControl initialCount={6} maxTotalCount={50} maxCount={10} onAdd={addFn} />);
        const inputWrapper = document.querySelector('input');
        await userEvent.type(inputWrapper, '100');
        expect(document.querySelectorAll('.text-danger')).toHaveLength(1);
        expect(document.querySelector('.text-danger').textContent).toBe(
            'At most 50 rows can be added at once (10 remaining).'
        );
    });

    test('invalid row count with large maxTotalCount', async () => {
        const addFn = jest.fn();
        render(<AddRowsControl initialCount={6} maxTotalCount={5000} maxCount={10} onAdd={addFn} />);
        const inputWrapper = document.querySelector('input');
        await userEvent.type(inputWrapper, '100');
        expect(document.querySelectorAll('.text-danger')).toHaveLength(1);
        expect(document.querySelector('.text-danger').textContent).toBe(
            'At most 5,000 rows can be added at once (10 remaining).'
        );
    });
});
