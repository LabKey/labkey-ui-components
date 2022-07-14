import React from 'react';
import { shallow } from 'enzyme';

import { HorizontalBarSection } from './HorizontalBarSection';

describe('HorizontalBarSection', () => {
    test('no data', () => {
        const wrapper = shallow(<HorizontalBarSection title="Test Allocation" subtitle="A description" data={[]} />);

        expect(wrapper.find('.horizontal-bar--title').text()).toBe('Test Allocation');
        expect(wrapper.find('.horizontal-bar--subtitle').text()).toBe('A description');
        expect(wrapper.find('.horizontal-bar-part')).toHaveLength(0);
    });

    test('with data', () => {
        const allocationData = [
            {
                title: "2 'Sample Type 1' samples",
                count: 2,
                totalCount: 10,
                percent: 20,
                backgroundColor: 'blue',
                href: '#/freezers/test/storageView?query.SampleType~eq=Sample Type 1&query.StorageStatus~eq=Checked out',
                filled: true,
            },
            {
                title: "3 'Sample Type 4' samples",
                count: 3,
                totalCount: 10,
                percent: 30,
                backgroundColor: 'orange',
                href: '#/freezers/test/storageView?query.SampleType~eq=Sample Type 4&query.StorageStatus~eq=Checked out',
                filled: true,
            },
            {
                title: '5 samples not checked out',
                count: 5,
                totalCount: 10,
                percent: 50,
                filled: false,
            },
        ];
        const wrapper = shallow(
            <HorizontalBarSection title="Test Allocation" subtitle="A description" data={allocationData} />
        );

        expect(wrapper.find('.horizontal-bar--title').text()).toBe('Test Allocation');
        expect(wrapper.find('.horizontal-bar--subtitle').text()).toBe('A description');
        expect(wrapper.find('.horizontal-bar-part')).toHaveLength(3);
        expect(wrapper.find('.horizontal-bar--linked')).toHaveLength(2);
        expect(wrapper.find('.horizontal-bar--open')).toHaveLength(1);
        const parts = wrapper.find('.horizontal-bar-part');
        expect(parts).toHaveLength(3);
        expect(parts.at(0).prop('className')).toContain('horizontal-bar--linked');
        expect(parts.at(0).prop('style').width).toBe('20%');
        expect(parts.at(1).prop('className')).toContain('horizontal-bar--linked');
        expect(parts.at(1).prop('style').width).toBe('30%');
        expect(parts.at(2).prop('className')).toContain('horizontal-bar--open');
        expect(parts.at(2).prop('style').width).toBe('50%');
    });
});
