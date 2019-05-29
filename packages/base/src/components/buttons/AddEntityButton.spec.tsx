import * as React from 'react'
import renderer from 'react-test-renderer'
import { AddEntityButton } from './AddEntityButton';
import { shallow } from 'enzyme';

describe('<AddEntityButton />', () => {
    test('Default properties', () => {
        const onClick = jest.fn();
        const wrapper = shallow(<AddEntityButton onClick={onClick}/>);
        wrapper.find("span").simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(wrapper).toMatchSnapshot();
    });

    test("Specify entity and classes", () => {
        const onClick = jest.fn();
        const tree = renderer.create(<AddEntityButton entity="Test" onClick={onClick} containerClass="test-container-class" buttonClass="test-button-class"/>).toJSON();
        expect(tree).toMatchSnapshot();
    })
});

