import React from 'react';
import { mount } from 'enzyme';
import { MenuItem } from 'react-bootstrap';

import { ALIQUOT_FILTER_MODE } from '../../..';

import { SampleAliquotViewSelector } from './SampleAliquotViewSelector';

describe('<SampleAliquotViewSelector/>', () => {

    function verifyOptions(wrapper, all?: boolean, samples?: boolean, aliquots?: boolean) {
        const items = wrapper.find(MenuItem);

        expect(items).toHaveLength(4);

        expect(items.at(0).text()).toBe('Show Samples');

        expect(items.at(1).text()).toBe('Samples and Aliquots');
        expect(items.at(1).find('li').getDOMNode().getAttribute('class')).toBe(all ? 'active' : '');

        expect(items.at(2).text()).toBe('Samples Only');
        expect(items.at(2).find('li').getDOMNode().getAttribute('class')).toBe(samples ? 'active' : '');

        expect(items.at(3).text()).toBe('Aliquots Only');
        expect(items.at(3).find('li').getDOMNode().getAttribute('class')).toBe(aliquots ? 'active' : '');

        const buttons = wrapper.find('.dropdown-toggle');
        expect(buttons.at(0).text().trim()).toEqual(all ? 'All Samples' : samples ? 'Samples Only' : 'Aliquots Only');
    }

    test('aliquotFilterMode undefined', () => {
        const component = <SampleAliquotViewSelector updateAliquotFilter={jest.fn()} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, true);

        wrapper.unmount();
    });

    test('aliquotFilterMode: all', () => {
        const component = <SampleAliquotViewSelector updateAliquotFilter={jest.fn()} aliquotFilterMode={ALIQUOT_FILTER_MODE.all} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, true);

        wrapper.unmount();
    });

    test('aliquotFilterMode: samples', () => {
        const component = <SampleAliquotViewSelector updateAliquotFilter={jest.fn()} aliquotFilterMode={ALIQUOT_FILTER_MODE.samples} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, false, true);

        wrapper.unmount();
    });

    test('aliquotFilterMode: aliquots', () => {
        const component = <SampleAliquotViewSelector updateAliquotFilter={jest.fn()} aliquotFilterMode={ALIQUOT_FILTER_MODE.aliquots} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, false, false, true);

        wrapper.unmount();
    });

    test('customized labels', () => {
        const component = <SampleAliquotViewSelector
            updateAliquotFilter={jest.fn()}
            headerLabel={'Show Jobs with Samples'}
            samplesLabel={'Parent Sample Only'}
            allLabel={'Parent Sample and Aliquots'}
        />;
        const wrapper = mount(component);

        const items = wrapper.find(MenuItem);

        expect(items).toHaveLength(4);

        expect(items.at(0).text()).toBe('Show Jobs with Samples');

        expect(items.at(1).text()).toBe('Parent Sample and Aliquots');
        expect(items.at(2).text()).toBe('Parent Sample Only');
        expect(items.at(3).text()).toBe('Aliquots Only');

        wrapper.unmount();
    });

});
