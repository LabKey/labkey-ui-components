import * as React from 'react'
import { mount } from 'enzyme'
import { List } from 'immutable'

import { SelectionMenuItem } from "./SelectionMenuItem";
import { QueryGridModel } from "../../models/model";
import { MenuItem, OverlayTrigger } from "react-bootstrap";

describe("<SelectionMenuItem/>", () => {

    test("without selections", () => {
        const text = 'Menu Item Text';
        const model = new QueryGridModel({
            totalRows: 3,
            selectedIds: List()
        });
        const component = (
            <SelectionMenuItem id={'jest-test-1'} model={model} text={text} onClick={jest.fn()}/>
        );

        const wrapper = mount(component);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find(MenuItem).text()).toBe(text);
        expect(wrapper.find('li').getDOMNode().getAttribute('class')).toBe('disabled');
        expect(wrapper.find(OverlayTrigger)).toHaveLength(1);
        wrapper.unmount();
    });

    test("with selections", () => {
        const text = 'Menu Item Text';
        const model = new QueryGridModel({
            totalRows: 3,
            selectedIds: List(["1","2"])
        });
        const component = (
            <SelectionMenuItem id={'jest-test-1'} model={model} text={text} onClick={jest.fn()}/>
        );

        const wrapper = mount(component);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find(MenuItem).text()).toBe(text);
        expect(wrapper.find('li').getDOMNode().getAttribute('class')).toBe('');
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);
        wrapper.unmount();
    });

});