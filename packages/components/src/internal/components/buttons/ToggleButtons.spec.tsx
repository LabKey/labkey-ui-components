import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { ToggleButtons } from './ToggleButtons';

describe('<ToggleButtons/>', () => {
    test('without active', () => {
        const onClickFn = jest.fn();
        const component = <ToggleButtons first="a" second="b" onClick={onClickFn} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with active', () => {
        const onClickFn = jest.fn();
        const component = <ToggleButtons first="a" second="b" active="b" onClick={onClickFn} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with className', () => {
        const onClickFn = jest.fn();
        const component = <ToggleButtons first="a" second="b" className="testing-cls" onClick={onClickFn} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('onClick handler', () => {
        const onClickFn = jest.fn();
        const component = <ToggleButtons first="a" second="b" active="b" onClick={onClickFn} />;
        const wrapper = mount(component);
        const aBtn = wrapper.findWhere(n => n.type() === 'button' && n.text() === 'a');
        const bBtn = wrapper.findWhere(n => n.type() === 'button' && n.text() === 'b');
        expect(onClickFn).toHaveBeenCalledTimes(0);
        aBtn.simulate('click');
        expect(onClickFn).toHaveBeenCalledTimes(1);
        aBtn.simulate('click');
        expect(onClickFn).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });
});
