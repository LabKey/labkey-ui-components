import * as React from 'react'
import { mount } from 'enzyme'

import { SampleDeleteConfirmModal } from "./SampleDeleteConfirmModal";

describe("<SampleDeleteConfirmModal/>", () => {

    test("numSamples of 1", () => {
        const component = (
            <SampleDeleteConfirmModal
                numSamples={1}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('.modal-content').text().indexOf('samples')).toBe(-1);
        expect(wrapper.find('.modal-title').text().indexOf('1 sample')).toBeGreaterThan(-1);
        expect(wrapper.find('.modal-body').text().indexOf('The sample and its')).toBeGreaterThan(-1);
        expect(wrapper.find('.modal-body').find('a')).toHaveLength(0);
        expect(wrapper.find('.modal-footer').find('button')).toHaveLength(2);
        wrapper.unmount();
    });

    test("numSamples of > 1", () => {
        const component = (
            <SampleDeleteConfirmModal
                numSamples={2}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('.modal-title').text().indexOf('2 samples')).toBeGreaterThan(-1);
        expect(wrapper.find('.modal-body').text().indexOf('All 2 samples and their')).toBeGreaterThan(-1);
        expect(wrapper.find('.modal-body').find('a')).toHaveLength(0);
        expect(wrapper.find('.modal-footer').find('button')).toHaveLength(2);
        wrapper.unmount();
    });

    test("showDependenciesLink prop", () => {
        const component = (
            <SampleDeleteConfirmModal
                numSamples={1}
                showDependenciesLink={true}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        const wrapper = mount(component);
        expect(wrapper.find('.modal-body').find('a')).toHaveLength(1);
        wrapper.unmount();
    });

    test("button clicks", () => {
        const onConfirmFn = jest.fn();
        const onCancelFn = jest.fn();
        const component = (
            <SampleDeleteConfirmModal
                numSamples={1}
                onCancel={onCancelFn}
                onConfirm={onConfirmFn}
            />
        );

        const wrapper = mount(component);
        const cancelBtn = wrapper.find('.modal-footer').findWhere(n => n.type() === 'button' && n.text() === 'Cancel');
        const confirmBtn = wrapper.find('.modal-footer').findWhere(n => n.type() === 'button' && n.text() === 'Yes, Delete');
        expect(onCancelFn).toHaveBeenCalledTimes(0);
        expect(onConfirmFn).toHaveBeenCalledTimes(0);

        cancelBtn.simulate('click');
        expect(onCancelFn).toHaveBeenCalledTimes(1);
        expect(onConfirmFn).toHaveBeenCalledTimes(0);

        confirmBtn.simulate('click');
        expect(onCancelFn).toHaveBeenCalledTimes(1);
        expect(onConfirmFn).toHaveBeenCalledTimes(1);

        confirmBtn.simulate('click');
        expect(onCancelFn).toHaveBeenCalledTimes(1);
        expect(onConfirmFn).toHaveBeenCalledTimes(2);

        wrapper.unmount();
    });

});