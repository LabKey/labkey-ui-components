import React from 'react';

import { InternalSpacesWarning } from './InternalSpacesWarning';
import { render } from '@testing-library/react';

describe('InternalSpacesWarning', () => {
    test('undefined value', () => {
        const { container } = render(<InternalSpacesWarning value={undefined} />);
        expect(container).toBeEmptyDOMElement();
    });

    test('null value', () => {
        const { container } = render(<InternalSpacesWarning value={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    test('empty value', () => {
        const { container } = render(<InternalSpacesWarning value="" />);
        expect(container).toBeEmptyDOMElement();
    });

    test('only spaces value', () => {
        const { container } = render(<InternalSpacesWarning value={'    '} />);
        expect(container).toBeEmptyDOMElement();
    });

    test('leading spaces value', () => {
        const { container } = render(<InternalSpacesWarning value="  leading spaces" />);
        expect(container).toBeEmptyDOMElement();
    });

    test('trailing spaces value', () => {
        const { container } = render(<InternalSpacesWarning value="trailingSpaces  " />);
        expect(container).toBeEmptyDOMElement();
    });

    test('single spaced value', () => {
        const { container } = render(<InternalSpacesWarning value="single spaces between   " />);
        expect(container).toBeEmptyDOMElement();
    });

    test('multiple spaces value', () => {
        const { container } = render(<InternalSpacesWarning value="multiple spaces   between   " />);
        expect(container).toHaveTextContent("This name contains multiple spaces between words. The extra spaces won't be visible to users.");
    });

    test('multiple spaces value, custom name', () => {
        const { container } = render(<InternalSpacesWarning value="  multiple  spaces" fieldName="sample" />);
        expect(container).toHaveTextContent("This sample contains multiple spaces between words. The extra spaces won't be visible to users.");
    });
});
