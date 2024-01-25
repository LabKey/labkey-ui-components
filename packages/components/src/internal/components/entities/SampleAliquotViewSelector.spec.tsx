import React from 'react';
import { mount } from 'enzyme';

import { ALIQUOT_FILTER_MODE } from '../samples/constants';

import { SampleAliquotViewSelector } from './SampleAliquotViewSelector';
import exp from 'node:constants';

describe('<SampleAliquotViewSelector/>', () => {
    function verifyOptions(wrapper, all?: boolean, samples?: boolean, aliquots?: boolean) {
        const items = wrapper.find('MenuItem');
        const buttonText = wrapper.find('.dropdown-toggle').at(0).text();
        expect(items).toHaveLength(3);
        expect(wrapper.find('MenuHeader').text()).toBe('Show Samples');
        expect(items.at(0).text()).toBe('Samples and Aliquots');
        expect(items.at(1).text()).toBe('Samples Only');
        expect(items.at(2).text()).toBe('Aliquots Only');

        if (all) {
            expect(items.at(0).find('li').getDOMNode().getAttribute('class')).toContain('active');
            expect(buttonText).toEqual('All Samples');
        } else {
            expect(items.at(0).find('li').getDOMNode().getAttribute('class')).not.toContain('active');
        }

        if (samples) {
            expect(items.at(1).find('li').getDOMNode().getAttribute('class')).toContain('active');
            expect(buttonText).toEqual('Samples Only');
        } else {
            expect(items.at(1).find('li').getDOMNode().getAttribute('class')).not.toContain('active');
        }

        if (aliquots) {
            expect(items.at(2).find('li').getDOMNode().getAttribute('class')).toContain('active');
            expect(buttonText).toEqual('Aliquots Only');
        } else {
            expect(items.at(2).find('li').getDOMNode().getAttribute('class')).not.toContain('active');
        }
    }

    test('aliquotFilterMode undefined', () => {
        const component = (
            <SampleAliquotViewSelector aliquotFilterMode={ALIQUOT_FILTER_MODE.all} updateAliquotFilter={jest.fn()} />
        );
        const wrapper = mount(component);

        verifyOptions(wrapper, true);

        wrapper.unmount();
    });

    test('aliquotFilterMode: all', () => {
        const component = (
            <SampleAliquotViewSelector updateAliquotFilter={jest.fn()} aliquotFilterMode={ALIQUOT_FILTER_MODE.all} />
        );
        const wrapper = mount(component);

        verifyOptions(wrapper, true);

        wrapper.unmount();
    });

    test('aliquotFilterMode: samples', () => {
        const component = (
            <SampleAliquotViewSelector
                updateAliquotFilter={jest.fn()}
                aliquotFilterMode={ALIQUOT_FILTER_MODE.samples}
            />
        );
        const wrapper = mount(component);

        verifyOptions(wrapper, false, true);

        wrapper.unmount();
    });

    test('aliquotFilterMode: aliquots', () => {
        const component = (
            <SampleAliquotViewSelector
                updateAliquotFilter={jest.fn()}
                aliquotFilterMode={ALIQUOT_FILTER_MODE.aliquots}
            />
        );
        const wrapper = mount(component);

        verifyOptions(wrapper, false, false, true);

        wrapper.unmount();
    });

    test('customized labels', () => {
        const component = (
            <SampleAliquotViewSelector
                aliquotFilterMode={ALIQUOT_FILTER_MODE.all}
                updateAliquotFilter={jest.fn()}
                headerLabel="Show Jobs with Samples"
                samplesLabel="Parent Sample Only"
                allLabel="Parent Sample and Aliquots"
            />
        );
        const wrapper = mount(component);

        const items = wrapper.find('MenuItem');

        expect(items).toHaveLength(3);

        expect(wrapper.find('MenuHeader').text()).toBe('Show Jobs with Samples');

        expect(items.at(0).text()).toBe('Parent Sample and Aliquots');
        expect(items.at(1).text()).toBe('Parent Sample Only');
        expect(items.at(2).text()).toBe('Aliquots Only');

        wrapper.unmount();
    });
});
