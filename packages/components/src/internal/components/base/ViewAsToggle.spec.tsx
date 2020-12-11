import React from 'react';
import { fromJS } from 'immutable';
import renderer from 'react-test-renderer';

import { ViewAsToggle } from './ViewAsToggle';

describe('<ViewAsToggle/>', () => {
    test('default properties', () => {
        const component = (
            <ViewAsToggle
                selected="first"
                options={fromJS({ first: 'First Label', second: 'Second Label' })}
                onSelectionChange={jest.fn()}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('invalid selection and id prop', () => {
        const component = (
            <ViewAsToggle
                selected="bogus"
                options={fromJS({ first: 'First Label', second: 'Second Label' })}
                id="test-id"
                onSelectionChange={jest.fn()}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
