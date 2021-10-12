import {mount} from "enzyme";
import React from "react";
import { ConfirmModal, LoadingSpinner, sleep} from "../../..";
import {Button, Checkbox} from "react-bootstrap";
import {NameIdSettingsForm} from "./NameIdSettings";

describe('NameIdSettings', () => {
    const DEFAULT_PROPS = {
        init: jest.fn(async () => {return {prefix: "ABC", allowUserSpecifiedNames: false}}),
        save: jest.fn(async () => {return null})
    };

    test('on init', async () => {
        const wrapper = mount(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        expect(wrapper.find(LoadingSpinner).length).toEqual(2);
        expect(wrapper.find('.prefix-field').exists()).toEqual(false);
        expect(wrapper.find(Checkbox).exists()).toEqual(false);

        await sleep();
        wrapper.update();

        expect(wrapper.find(LoadingSpinner).length).toEqual(0);
        expect(wrapper.find('.prefix-field').exists()).toEqual(true);
        expect(wrapper.find(Checkbox).exists()).toEqual(true);
        expect(DEFAULT_PROPS.init).toHaveBeenCalled();
    });

    test('prefix preview', async () => {
        const wrapper = mount(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await sleep();
        wrapper.update();

        expect(wrapper.find('.prefix-example').text()).toContain("ABC-Blood-${GenId}")
    });

    test('apply prefix confirm modal -- cancel', async () => {
        const wrapper = mount(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await sleep();
        wrapper.update();

        wrapper.find(Button).simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(true);
        wrapper.find('.close').simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(false);
    });

    test('apply prefix confirm modal -- save', async () => {
        const wrapper = mount(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await sleep();
        wrapper.update();

        wrapper.find(Button).simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(true);
        console.log(wrapper.find(Button).length);

        // Click on 'Yes, Save and Apply Prefix' button
        wrapper.find(Button).last().simulate('click');
        expect(DEFAULT_PROPS.save).toHaveBeenCalled();
    });
});
