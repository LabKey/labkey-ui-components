import React from 'react';
import renderer from 'react-test-renderer';

import { FieldExpansionToggle } from './FieldExpansionToggle';

describe('<FieldExpansionToggle/>', () => {
    test('default properties', () => {
        const component = (
            <FieldExpansionToggle
                id="expand-id"
                expanded={false}
                expandedTitle="Click to collapse"
                collapsedTitle="Click to expand"
                onClick={jest.fn()}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom properties', () => {
        const component = (
            <FieldExpansionToggle
                id="expand-custom-id"
                cls="expand-custom-cls"
                expanded={false}
                highlighted={true}
                expandedTitle="Custom click to collapse"
                collapsedTitle="Custom click to expand"
                onClick={jest.fn()}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('expanded and highlighted', () => {
        const component = (
            <FieldExpansionToggle
                id="expand-id"
                expanded={true}
                highlighted={false}
                expandedTitle="Click to collapse"
                collapsedTitle="Click to expand"
                onClick={jest.fn()}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
