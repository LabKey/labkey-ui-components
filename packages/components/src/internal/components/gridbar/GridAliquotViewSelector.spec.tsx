import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import { List } from 'immutable';
import { Checkbox } from 'react-bootstrap';

import { Filter } from '@labkey/api';

import { makeTestQueryModel, QueryGridModel, SchemaQuery } from '../../..';

import { GridAliquotViewSelector } from './GridAliquotViewSelector';

describe('<GridAliquotViewSelector/>', () => {
    test('no queryGridModel or queryModel', () => {
        const component = <GridAliquotViewSelector />;
        const tree = renderer.create(component).toJSON();
        expect(tree).toBe(null);
    });

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
        const checkboxes = wrapper.find(Checkbox);
        expect(checkboxes).toHaveLength(2);
        expect(checkboxes.at(0).props().checked).toBe(true);
        expect(checkboxes.at(1).props().checked).toBe(true);

        const buttons = wrapper.find('.dropdown-toggle');
        expect(buttons.at(0).text().trim()).toEqual('All Samples');

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
        const checkboxes = wrapper.find(Checkbox);
        expect(checkboxes).toHaveLength(2);
        expect(checkboxes.at(0).props().checked).toBe(true);
        expect(checkboxes.at(1).props().checked).toBe(false);

        const buttons = wrapper.find('.dropdown-toggle');
        expect(buttons.at(0).text().trim()).toEqual('Samples Only');

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
        const checkboxes = wrapper.find(Checkbox);
        expect(checkboxes).toHaveLength(2);
        expect(checkboxes.at(0).props().checked).toBe(false);
        expect(checkboxes.at(1).props().checked).toBe(true);

        const buttons = wrapper.find('.dropdown-toggle');
        expect(buttons.at(0).text().trim()).toEqual('Aliquots Only');

        wrapper.unmount();
    });

    test('with queryModel, without filter', () => {
        const model = makeTestQueryModel(SchemaQuery.create('a', 'b'));

        const component = <GridAliquotViewSelector queryModel={model} />;
        const wrapper = mount(component);
        const checkboxes = wrapper.find(Checkbox);
        expect(checkboxes).toHaveLength(2);
        expect(checkboxes.at(0).props().checked).toBe(true);
        expect(checkboxes.at(1).props().checked).toBe(true);

        const buttons = wrapper.find('.dropdown-toggle');
        expect(buttons.at(0).text().trim()).toEqual('All Samples');

        wrapper.unmount();
    });

    test('with queryModel, with filter', () => {
        let model = makeTestQueryModel(SchemaQuery.create('a', 'b'));
        model = model.mutate({
            filterArray: [Filter.create('IsAliquot', true)],
        });
        const component = <GridAliquotViewSelector queryModel={model} />;
        const wrapper = mount(component);
        const checkboxes = wrapper.find(Checkbox);
        expect(checkboxes).toHaveLength(2);
        expect(checkboxes.at(0).props().checked).toBe(false);
        expect(checkboxes.at(1).props().checked).toBe(true);

        const buttons = wrapper.find('.dropdown-toggle');
        expect(buttons.at(0).text().trim()).toEqual('Aliquots Only');

        wrapper.unmount();
    });
});
