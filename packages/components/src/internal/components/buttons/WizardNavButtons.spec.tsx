import React from 'react';
import { mount } from 'enzyme';

import { WizardNavButtons } from './WizardNavButtons';

describe('<WizardNavButtons/>', () => {
    test('default props', () => {
        const wrapper = mount(<WizardNavButtons cancel={jest.fn()} />);
        expect(wrapper.find('button').length === 2);
        expect(wrapper.find('button').at(0).text()).toEqual('Cancel');
        expect(wrapper.find('button').at(1).text()).toEqual('Next');
        expect(wrapper.find('button').at(1).prop('disabled')).toEqual(false);
    });

    test('finish props', () => {
        const wrapper = mount(
            <WizardNavButtons
                cancel={jest.fn()}
                finishText="Custom Finish"
                finish
                nextStep={jest.fn()}
                canFinish={false}
            />
        );
        expect(wrapper.find('button').length).toEqual(2);
        expect(wrapper.find('button').at(0).text()).toEqual('Cancel');
        expect(wrapper.find('button').at(1).text()).toEqual('Custom Finish');
        expect(wrapper.find('button').at(1).prop('disabled')).toEqual(true);
    });

    test('with children', () => {
        const wrapper = mount(
            <WizardNavButtons cancel={jest.fn()}>
                <button className="test-btn-1" type="button">
                    My Additional Button
                </button>
            </WizardNavButtons>
        );
        expect(wrapper.find('button').length).toEqual(3);
        expect(wrapper.find('button').at(0).text()).toEqual('Cancel');
        expect(wrapper.find('button').at(1).text()).toEqual('My Additional Button');
    });

    test('onClick handlers', () => {
        const cancelFn = jest.fn();
        const prevFn = jest.fn();
        const nextFn = jest.fn();
        const wrapper = mount(<WizardNavButtons cancel={cancelFn} previousStep={prevFn} nextStep={nextFn} />);
        expect(cancelFn).toHaveBeenCalledTimes(0);
        expect(prevFn).toHaveBeenCalledTimes(0);
        expect(nextFn).toHaveBeenCalledTimes(0);

        wrapper.findWhere(n => n.type() === 'button' && n.text() === 'Cancel').simulate('click');
        expect(cancelFn).toHaveBeenCalledTimes(1);
        expect(prevFn).toHaveBeenCalledTimes(0);
        expect(nextFn).toHaveBeenCalledTimes(0);

        wrapper.findWhere(n => n.type() === 'button' && n.text() === 'Back').simulate('click');
        expect(cancelFn).toHaveBeenCalledTimes(1);
        expect(prevFn).toHaveBeenCalledTimes(1);
        expect(nextFn).toHaveBeenCalledTimes(0);

        wrapper.findWhere(n => n.type() === 'button' && n.text() === 'Next').simulate('click');
        expect(cancelFn).toHaveBeenCalledTimes(1);
        expect(prevFn).toHaveBeenCalledTimes(1);
        expect(nextFn).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
});
