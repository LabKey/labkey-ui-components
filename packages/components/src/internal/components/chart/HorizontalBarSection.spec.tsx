import React from 'react';
import { shallow } from 'enzyme';
import { HorizontalBarSection } from './HorizontalBarSection';

describe("HorizontalBarSection", () => {
    test("no data", () => {
        const wrapper = shallow(<HorizontalBarSection title={"Test Allocation"} subtitle={"A description"} data={[]} />)

        expect(wrapper.find(".horizontal-bar--title").text()).toBe("Test Allocation");
        expect(wrapper.find(".horizontal-bar--subtitle").text()).toBe("A description");
        expect(wrapper.find('.horizontal-bar-part')).toHaveLength(0);

        wrapper.unmount();
    });

    test("with data", () => {
        const allocationData = [
            {
                title: "7 'Sample Type 1' samples",
                count: 7,
                totalCount: 37,
                percent: 8.536585365853659,
                backgroundColor: 'blue',
                href: '#/freezers/test/storageView?query.SampleType~eq=Sample Type 1&query.StorageStatus~eq=Checked out',
                filled: true
            },
            {
                title: "30 'Sample Type 4' samples",
                count: 30,
                totalCount: 37,
                percent: 36.58536585365854,
                backgroundColor: 'orange',
                href: '#/freezers/test/storageView?query.SampleType~eq=Sample Type 4&query.StorageStatus~eq=Checked out',
                filled: true
            },
            {
                title: '45 samples not checked out',
                count: 45,
                totalCount: 37,
                percent: 54.87804878048781,
                filled: false
            }
        ];
        const wrapper = shallow(<HorizontalBarSection title={"Test Allocation"} subtitle={"A description"} data={allocationData} />)

        expect(wrapper.find(".horizontal-bar--title").text()).toBe("Test Allocation");
        expect(wrapper.find(".horizontal-bar--subtitle").text()).toBe("A description");
        expect(wrapper.find('.horizontal-bar-part')).toHaveLength(3);
        const parts = wrapper.find('.horizontal-bar-part');
        expect(parts).toHaveLength(3);
        expect(parts.at(0).prop("className")).toContain("horizontal-bar--begin");
        expect(parts.at(0).prop("className")).toContain("horizontal-bar--filled");
        expect(parts.at(2).prop("className")).toContain("horizontal-bar--open");

        wrapper.unmount();
    });
});
