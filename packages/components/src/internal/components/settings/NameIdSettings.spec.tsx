import {mount, shallow} from "enzyme";
import React from "react";
import { NameIdSettings } from "../../..";
import {Checkbox} from "react-bootstrap";

describe('NameIdSettings', () => {

    test('click checkbox', () => {
        const wrapper = mount(<NameIdSettings/>);
        // const spy = jest.spyOn(wrapper.instance(), 'saveAllowUserSpecifiedNames');
        // wrapper.instance().saveAllowUserSpecifiedNames = jest.fn(() => wrapper.setState({modalOpen: true}));

        wrapper.find(Checkbox).simulate('click');


        console.log(wrapper.debug()); // click, verify callback

    });

    test('prefix preview', () => {
        const wrapper = shallow(<NameIdSettings/>);

    });

    test('apply prefix confirm modal -- cancel', () => {
        const wrapper = shallow(<NameIdSettings/>);

    });

    test('apply prefix confirm modal -- save', () => {
        const wrapper = shallow(<NameIdSettings/>);

    });
});
