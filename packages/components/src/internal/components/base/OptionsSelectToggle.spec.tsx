import React from 'react';
import { fromJS } from 'immutable';
import renderer from 'react-test-renderer';

import { OptionsSelectToggle } from './OptionsSelectToggle';

describe('<OptionsSelectToggle/>', () => {
    test('default properties', () => {
        const component = (
            <OptionsSelectToggle
                selected="first"
                options={fromJS({ first: 'First Label', second: 'Second Label' })}
                onSelectionChange={jest.fn()}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('invalid selection and optional props', () => {
        const component = (
            <OptionsSelectToggle
                selected="bogus"
                options={fromJS({ first: 'First Label', second: 'Second Label' })}
                id="test-id"
                label="Test Label"
                onSelectionChange={jest.fn()}
            />
        );
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
