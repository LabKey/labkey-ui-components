import React from 'react';
import renderer from 'react-test-renderer';

import { ExpandableFilterToggle } from './ExpandableFilterToggle';

describe('<ExpandableFilterToggle/>', () => {
    test('default properties without filters', () => {
        const component = (
            <ExpandableFilterToggle
                filterExpanded={false}
                hasFilter={false}
                toggleFilterPanel={jest.fn()}
                resetFilter={jest.fn()}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('custom properties with filters', () => {
        const component = (
            <ExpandableFilterToggle
                filterExpanded={true}
                hasFilter={true}
                panelCls={'test-cls'}
                toggleFilterPanel={jest.fn()}
                resetFilter={jest.fn()}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
