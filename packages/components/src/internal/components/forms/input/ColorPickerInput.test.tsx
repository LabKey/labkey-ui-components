import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ColorPickerInput } from './ColorPickerInput';

describe('ColorPickerInput', () => {
    test('default props', () => {
        const component = <ColorPickerInput value="#000000" onChange={jest.fn} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('without value', () => {
        const component = <ColorPickerInput value={undefined} onChange={jest.fn} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('with button text', () => {
        const component = <ColorPickerInput value="#000000" text="Select color..." onChange={jest.fn} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('showPicker', () => {
        const component = <ColorPickerInput value="#000000" onChange={jest.fn} />;
        const { container } = render(component);
        userEvent.click(document.querySelector('.color-picker__button'));
        expect(container).toMatchSnapshot();
    });

    test('allowRemove', () => {
        const component = <ColorPickerInput value="#000000" onChange={jest.fn} allowRemove={true} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
