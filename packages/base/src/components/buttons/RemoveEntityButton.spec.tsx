import * as React from 'react'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme';
import { RemoveEntityButton } from './RemoveEntityButton';

describe('<RemoveEntityButton />', () => {
    test('Default properties', () => {
        const onClick = jest.fn();
        const wrapper = shallow(<RemoveEntityButton onClick={onClick}/>);
        wrapper.find("span").simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(wrapper).toMatchSnapshot();
    });

    test("Specify entity without index", () => {
        const onClick = jest.fn();
        const tree = renderer.create(<RemoveEntityButton entity="Test" onClick={onClick}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("Specify label class, index, and entity", () => {
        const onClick = jest.fn();
        const tree = renderer.create(<RemoveEntityButton entity="Test" onClick={onClick} labelClass="test-label-class" index={3}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });
});

