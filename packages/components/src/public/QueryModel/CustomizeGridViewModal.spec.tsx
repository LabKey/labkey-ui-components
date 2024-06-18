import React from 'react';

import { mount } from 'enzyme';

import { ExtendedMap } from '../ExtendedMap';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { ViewInfo } from '../../internal/ViewInfo';
import { QueryColumn } from '../QueryColumn';
import { ColumnChoice, ColumnInView } from '../../internal/components/ColumnSelectionModal';

import { makeTestQueryModel } from './testUtils';

import { CustomizeGridViewModal, includedColumnsForCustomizationFilter } from './CustomizeGridViewModal';

describe('CustomizeGridViewModal', () => {
    const FIELD_1_COL = new QueryColumn({
        name: 'field/1',
        fieldKey: 'field$S1',
        fieldKeyArray: ['field/1'],
        fieldKeyPath: 'field$S1',
        selectable: true,
    });
    const FIELD_2_COL = new QueryColumn({
        name: 'field+2',
        fieldKey: 'field+2',
        fieldKeyArray: ['field+2'],
        fieldKeyPath: 'field+2',
        selectable: true,
    });
    const FIELD_3_COL = new QueryColumn({
        name: 'field3',
        fieldKey: 'field3',
        fieldKeyArray: ['field3'],
        fieldKeyPath: 'field3',
        selectable: true,
    });
    const SYSTEM_COL = new QueryColumn({
        name: 'systemCol',
        fieldKey: 'systemCol',
        fieldKeyArray: ['systemCol'],
        fieldKeyPath: 'systemCol',
        selectable: true,
        hidden: true,
    });
    const HIDDEN_COL = new QueryColumn({
        name: 'hiddenCol',
        fieldKey: 'hiddenCol',
        fieldKeyArray: ['hiddenCol'],
        fieldKeyPath: 'hiddenCol',
        selectable: true,
        hidden: true,
    });
    const columns = new ExtendedMap<string, QueryColumn>({
        field$s1: FIELD_1_COL,
        'field+2': FIELD_2_COL,
        field3: FIELD_3_COL,
        systemCol: SYSTEM_COL,
        hiddenCol: HIDDEN_COL,
    });

    const QUERY_NAME = 'queryTest';

    test('With title, no view', () => {
        const view = ViewInfo.fromJson({ name: 'default' });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        let model = makeTestQueryModel(new SchemaQuery('test', QUERY_NAME), queryInfo);
        model = model.mutate({ title: 'Title' });
        const wrapper = mount(<CustomizeGridViewModal model={model} onCancel={jest.fn()} onUpdate={jest.fn()} />);
        expect(wrapper.find('.modal-title').text()).toBe('Customize Title Grid');
        wrapper.unmount();
    });

    test('Without title, with view name', () => {
        const viewName = 'viewForTesting';
        const view = ViewInfo.fromJson({ name: viewName });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap({ [viewName.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(new SchemaQuery('test', QUERY_NAME, viewName), queryInfo);
        const wrapper = mount(<CustomizeGridViewModal model={model} onCancel={jest.fn()} onUpdate={jest.fn()} />);
        expect(wrapper.find('.modal-title').text()).toBe('Customize ' + QUERY_NAME + ' Grid - ' + viewName);
        wrapper.unmount();
    });

    test('Columns in View and All Fields,', () => {
        const view = ViewInfo.fromJson({
            name: ViewInfo.DEFAULT_NAME,
            columns: [FIELD_1_COL, FIELD_2_COL],
        });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(new SchemaQuery('test', QUERY_NAME), queryInfo);
        const wrapper = mount(<CustomizeGridViewModal model={model} onCancel={jest.fn()} onUpdate={jest.fn()} />);
        let columnChoices = wrapper.find(ColumnChoice);
        expect(columnChoices).toHaveLength(3);
        expect(columnChoices.at(0).text()).toBe(FIELD_1_COL.name);
        expect(columnChoices.at(0).prop('isInView')).toBe(true);
        expect(columnChoices.at(1).text()).toBe(FIELD_2_COL.name);
        expect(columnChoices.at(1).prop('isInView')).toBe(true);
        expect(columnChoices.at(2).text()).toBe(FIELD_3_COL.name);
        expect(columnChoices.at(2).prop('isInView')).toBe(false);

        const columnsInView = wrapper.find(ColumnInView);
        expect(columnsInView).toHaveLength(2);
        expect(columnsInView.at(0).text()).toBe(FIELD_1_COL.name);
        expect(columnsInView.at(1).text()).toBe(FIELD_2_COL.name);

        const toggleAll = wrapper.find('input');
        toggleAll.simulate('change', { target: { checked: true } });
        columnChoices = wrapper.find(ColumnChoice);
        expect(columnChoices).toHaveLength(5);
        expect(columnChoices.at(0).text()).toBe(FIELD_1_COL.name);
        expect(columnChoices.at(1).text()).toBe(FIELD_2_COL.name);
        expect(columnChoices.at(2).text()).toBe(FIELD_3_COL.name);
        expect(columnChoices.at(3).text()).toBe(SYSTEM_COL.name);
        expect(columnChoices.at(3).prop('isInView')).toBe(false);
        expect(columnChoices.at(4).text()).toBe(HIDDEN_COL.name);
        expect(columnChoices.at(4).prop('isInView')).toBe(false);

        // no changes made yet, so update button is disabled
        let updateButton = wrapper.find('.btn-success');
        expect(updateButton.prop('disabled')).toBe(true);

        // remove a field, expect button to become enabled
        wrapper.find('.fa-times').at(0).simulate('click');
        updateButton = wrapper.find('.btn-success');
        expect(updateButton.prop('disabled')).toBeFalsy();
        expect(wrapper.find(ColumnChoice).at(0).prop('isInView')).toBe(false);
        expect(wrapper.find(ColumnInView)).toHaveLength(1);

        // remove the other field in the view and expect button to become disabled again
        wrapper.find('.fa-times').at(0).simulate('click');
        updateButton = wrapper.find('.btn-success');
        expect(updateButton.prop('disabled')).toBe(true);
        expect(wrapper.find(ColumnInView)).toHaveLength(0);

        // add back one of the hidden columns
        wrapper.find(ColumnChoice).at(4).find('.fa-plus').simulate('click');
        expect(wrapper.find('.btn-success').prop('disabled')).toBeFalsy();

        wrapper.unmount();
    });

    test('with selectedColumn', () => {
        const view = ViewInfo.fromJson({
            name: ViewInfo.DEFAULT_NAME,
            columns: [FIELD_1_COL, FIELD_2_COL],
        });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(new SchemaQuery('test', QUERY_NAME), queryInfo);
        const wrapper = mount(
            <CustomizeGridViewModal
                model={model}
                onCancel={jest.fn()}
                onUpdate={jest.fn()}
                selectedColumn={FIELD_2_COL}
            />
        );
        let colsInView = wrapper.find(ColumnInView);
        // selected column passed in should be highlighted
        expect(colsInView.at(0).prop('selected')).toBe(false);
        expect(colsInView.at(1).prop('selected')).toBe(true);

        // clicking a new column should change the selected index
        colsInView.at(0).find('.field-name span').simulate('click');
        colsInView = wrapper.find(ColumnInView);
        expect(colsInView.at(0).prop('selected')).toBe(true);
        expect(colsInView.at(1).prop('selected')).toBe(false);

        // clicking on the same column should unselect
        colsInView.at(0).find('.field-name span').simulate('click');
        colsInView = wrapper.find(ColumnInView);
        expect(colsInView.at(0).prop('selected')).toBe(false);
        expect(colsInView.at(1).prop('selected')).toBe(false);
    });
});

describe('includedColumnsForCustomizationFilter', () => {
    test('hidden', () => {
        let col = new QueryColumn({ name: 'testColumn', hidden: false });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeTruthy();

        col = new QueryColumn({ name: 'testColumn', hidden: true });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeTruthy();
    });

    test('removeFromViews', () => {
        let col = new QueryColumn({ name: 'testColumn', removeFromViews: false });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();

        col = new QueryColumn({ name: 'testColumn', removeFromViews: true });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();
    });

    test('removeFromViewCustomization', () => {
        let col = new QueryColumn({ name: 'testColumn', removeFromViewCustomization: false });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeTruthy();

        col = new QueryColumn({ name: 'testColumn', removeFromViewCustomization: true });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeFalsy();

        LABKEY.moduleContext = { api: { moduleNames: ['api', 'core', 'premium'] } };
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeTruthy();
    });

    test('ancestor nodes', () => {
        let col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Run/SampleID/Ancestors' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Run/SampleID/Ancestors/Samples/Type/Ancestors' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'SampleID/Ancestors/Samples/Type1' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Ancestors/Samples/Type1' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Ancestors/Samples/Type1/Ancestors' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Ancestors/Sources/Type1/Ancestors/Samples/Type2' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();

        col = new QueryColumn({ name: 'testColumn', fieldKeyPath: 'Ancestors' });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy();
    });
});
