import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { Filter } from '@labkey/api';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { IS_ALIQUOT_COL } from '../samples/constants';

import { GridAliquotViewSelector } from './GridAliquotViewSelector';

describe('<GridAliquotViewSelector/>', () => {
    beforeEach(() => {
        LABKEY.moduleContext = { samplemanagement: { 'experimental-sample-aliquot-selector': true } };
    });

    test('no queryModel', () => {
        const component = <GridAliquotViewSelector />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBe(null);
    });

    test('experimental flag disabled', () => {
        LABKEY.moduleContext = { samplemanagement: { 'experimental-sample-aliquot-selector': false } };
        const model = makeTestQueryModel(new SchemaQuery('a', 'b'));
        const component = <GridAliquotViewSelector queryModel={model} />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBe(null);
    });

    // Note: this method is identical to the one for SampleAliquotViewSelector, so it feels like we're mostly just
    // testing that component again. Is there something more specific to GridAliquotViewSelector that we should be
    // testing?
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

    test('with queryModel, without filter', () => {
        const model = makeTestQueryModel(new SchemaQuery('a', 'b'));

        const component = <GridAliquotViewSelector queryModel={model} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, true);

        wrapper.unmount();
    });

    test('with queryModel, filtered to aliquots only', () => {
        let model = makeTestQueryModel(new SchemaQuery('a', 'b'));
        model = model.mutate({
            filterArray: [Filter.create(IS_ALIQUOT_COL, true)],
        });
        const component = <GridAliquotViewSelector queryModel={model} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, false, false, true);

        wrapper.unmount();
    });

    test('with queryModel, filtered to samples only', () => {
        let model = makeTestQueryModel(new SchemaQuery('a', 'b'));
        model = model.mutate({
            filterArray: [Filter.create(IS_ALIQUOT_COL, false)],
        });
        const component = <GridAliquotViewSelector queryModel={model} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, false, true);

        wrapper.unmount();
    });
});
