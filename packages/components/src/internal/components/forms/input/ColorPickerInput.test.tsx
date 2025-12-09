import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { ColorPickerInput } from './ColorPickerInput';

describe('ColorPickerInput', () => {
    test('default props', () => {
        const { container } = render(<ColorPickerInput onChange={jest.fn} value="#000000" />);
        expect(container).toMatchSnapshot();
    });

    test('without value', () => {
        const { container } = render(<ColorPickerInput onChange={jest.fn} value={undefined} />);
        expect(container).toMatchSnapshot();
    });

    test('with button text', () => {
        const { container } = render(<ColorPickerInput onChange={jest.fn} text="Select color..." value="#000000" />);
        expect(container).toMatchSnapshot();
    });

    test('with placeholder', () => {
        render(<ColorPickerInput onChange={jest.fn} placeholder="Auto" value={undefined} />);
        expect(document.querySelector('.color-picker__button')?.textContent).toBe('Auto');
        expect(document.querySelectorAll('.color-picker__placeholder')).toHaveLength(1);
    });

    test('showPicker', async () => {
        const { container } = render(<ColorPickerInput onChange={jest.fn} value="#000000" />);
        await userEvent.click(document.querySelector('.color-picker__button'));
        expect(container).toMatchSnapshot();
    });

    test('allowRemove', () => {
        const { container } = render(<ColorPickerInput allowRemove onChange={jest.fn} value="#000000" />);
        expect(container).toMatchSnapshot();
    });

    test('disabled', () => {
        const { container } = render(<ColorPickerInput disabled onChange={jest.fn} value="#000000" />);
        expect(container).toMatchSnapshot();
    });
});
