import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import { List } from 'immutable';
import { MenuItem } from 'react-bootstrap';

import { Filter } from '@labkey/api';

import { makeTestQueryModel, QueryGridModel, SchemaQuery } from '../../..';

import { GridAliquotViewSelector } from './GridAliquotViewSelector';

describe('<GridAliquotViewSelector/>', () => {
    test('no queryGridModel or queryModel', () => {
        const component = <GridAliquotViewSelector />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBe(null);
    });

    function verifyOptions(wrapper, all?: boolean, samples?: boolean, aliquots?: boolean)
    {
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
        expect(buttons.at(0).text().trim()).toEqual(all ? 'All Samples' : (samples ? 'Samples Only' : 'Aliquots Only'));
    }
    test('with queryGridModel, no filter', () => {
        const model = new QueryGridModel({
            isLoaded: false,
            isLoading: true,
            selectedLoaded: false,
            maxRows: undefined,
            totalRows: undefined,
        });
        const component = <GridAliquotViewSelector queryGridModel={model} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, true);

        wrapper.unmount();
    });

    test('with queryGridModel, filtered to samples only', () => {
        const model = new QueryGridModel({
            isLoaded: false,
            isLoading: true,
            selectedLoaded: false,
            maxRows: undefined,
            totalRows: undefined,
            filterArray: List([Filter.create('IsAliquot', false)]),
        });
        const component = <GridAliquotViewSelector queryGridModel={model} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, false, true);

        wrapper.unmount();
    });

    test('with queryGridModel, filtered to aliquots only', () => {
        const model = new QueryGridModel({
            isLoaded: false,
            isLoading: true,
            selectedLoaded: false,
            maxRows: undefined,
            totalRows: undefined,
            filterArray: List([Filter.create('IsAliquot', 'true')]),
        });
        const component = <GridAliquotViewSelector queryGridModel={model} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, false, false, true);

        wrapper.unmount();
    });

    test('with queryModel, without filter', () => {
        const model = makeTestQueryModel(SchemaQuery.create('a', 'b'));

        const component = <GridAliquotViewSelector queryModel={model} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, true,);

        wrapper.unmount();
    });

    test('with queryModel, with filter', () => {
        let model = makeTestQueryModel(SchemaQuery.create('a', 'b'));
        model = model.mutate({
            filterArray: [Filter.create('IsAliquot', true)],
        });
        const component = <GridAliquotViewSelector queryModel={model} />;
        const wrapper = mount(component);

        verifyOptions(wrapper, false, false, true);

        wrapper.unmount();
    });
});
