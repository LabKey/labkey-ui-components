import React from 'react';
import { shallow } from 'enzyme';
import renderer from 'react-test-renderer';

import { ColorPickerInput } from '../../../../index';

describe('ColorPickerInput', () => {
    test('default props', () => {
        const component = <ColorPickerInput value="#000000" onChange={jest.fn} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('without value', () => {
        const component = <ColorPickerInput value={undefined} onChange={jest.fn} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with button text', () => {
        const component = <ColorPickerInput value="#000000" text="Select color..." onChange={jest.fn} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('showPicker', () => {
        const component = shallow(<ColorPickerInput value="#000000" onChange={jest.fn} />);
        component.setState({ showPicker: true });
        expect(component).toMatchSnapshot();
    });

    test('allowRemove', () => {
        const component = <ColorPickerInput value="#000000" onChange={jest.fn} allowRemove={true} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });
});
