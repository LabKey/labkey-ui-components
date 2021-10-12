import {mount, shallow} from "enzyme";
import React from "react";
import {App, LoadingSpinner, sleep} from "../../..";
import {Checkbox, FormControl} from "react-bootstrap";
import {mountWithServerContext} from "../../testHelpers";
import {act} from "react-test-renderer";



describe('NameIdSettings', () => {
    const DEFAULT_PROPS = {
        init: jest.fn(async () => {return {prefix: "ABC", allowUserSpecifiedNames: false}}),
        save: jest.fn()
    }

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

        // wrapper.instance().saveAllowUserSpecifiedNames();
        // expect(save).toHaveBeenCalled();
    });
    //
    // test('prefix preview', () => {
    //     const wrapper = shallow(<NameIdSettingsForm api={testAPI} />);
    //
    // });
    //
    // test('apply prefix confirm modal -- cancel', () => {
    //     const wrapper = shallow(<NameIdSettingsForm api={testAPI} />);
    //
    // });
    //
    // test('apply prefix confirm modal -- save', () => {
    //     const wrapper = shallow(<NameIdSettingsForm api={testAPI} />);
    //
    // });
});
