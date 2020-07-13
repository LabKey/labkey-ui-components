import React from 'react';
import { mount } from "enzyme";
import { ColorIcon } from "./ColorIcon";

describe('ColorIcon', () => {
    function verifyIconDisplay(wrapper: any, color: string, asSquare = false, label?: string): void {
        expect(wrapper.find('i')).toHaveLength(1);
        const icon = wrapper.find('i').first();
        expect(icon.props().style['color']).toBe(asSquare ? undefined : color);
        expect(icon.props().style['backgroundColor']).toBe(asSquare ? color : undefined);
        if (color.toLowerCase() === '#ffffff') {
            expect(icon.props().style['border']).not.toBe(undefined);
        } else {
            expect(icon.props().style['border']).toBe(undefined);
        }

        const spans = wrapper.find('span');
        if (label) {
            expect(spans).toHaveLength(1);
            expect(spans.first().text()).toBe(label);
        } else {
            expect(spans).toHaveLength(0);
        }
    }

    test('value prop', () => {
        const wrapper = mount(<ColorIcon value={undefined}/>);
        expect(wrapper.find('i')).toHaveLength(0);

        const color = '#000000';
        wrapper.setProps({value: color});
        verifyIconDisplay(wrapper, color);

        wrapper.unmount();
    });

    test('asSquare prop', () => {
        let color = '#000000';
        const wrapper = mount(<ColorIcon value={color} asSquare={true}/>);
        verifyIconDisplay(wrapper, color, true);

        // handling of color white
        color = '#ffffff';
        wrapper.setProps({value: color});
        verifyIconDisplay(wrapper, color, true);

        wrapper.unmount();
    });

    test('with label prop', () => {
        let color = '#000000';
        const label = 'Color Label';
        const wrapper = mount(<ColorIcon value={color} label={label}/>);
        verifyIconDisplay(wrapper, color, false, label);

        color = '#ffffff';
        wrapper.setProps({asSquare: true, value: color});
        verifyIconDisplay(wrapper, color, true, label);
    });
});
