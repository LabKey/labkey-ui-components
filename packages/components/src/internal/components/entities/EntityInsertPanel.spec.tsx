import React from 'react';
import { EntityInsertPanelImpl } from './EntityInsertPanel';
import { mount } from 'enzyme';

describe("<EntityInsertPanel/>, getWarningFieldList", () => {
    test("no fields", () => {
        expect(EntityInsertPanelImpl.getWarningFieldList([])).toStrictEqual([]);

    });

    test("one field", () => {
        const wrapper = mount(<div>{EntityInsertPanelImpl.getWarningFieldList(['one'])}</div>);
        expect(wrapper.text()).toBe("one");
        wrapper.unmount();
    });

    test("two fields", () => {
        const wrapper = mount(<div>{EntityInsertPanelImpl.getWarningFieldList(['one', 'two'])}</div>);
        expect(wrapper.text()).toBe("one and two");
        wrapper.unmount();
    });

    test("multiple fields", () => {
        const wrapper = mount(<div>{EntityInsertPanelImpl.getWarningFieldList(['one', 'two', 'three', 'four', 'five'])}</div>);
        expect(wrapper.text()).toBe("one, two, three, four, and five");
        wrapper.unmount();
    });
});

describe("<EntityInsertPanel/>, getInferredFieldWarnings", () => {

});
