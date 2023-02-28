import React from 'react';

import { mount, ReactWrapper } from 'enzyme';

import { Modal, OverlayTrigger } from 'react-bootstrap';

import { fromJS } from 'immutable';

import { Draggable } from 'react-beautiful-dnd';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { ViewInfo } from '../../internal/ViewInfo';
import { QueryColumn, QueryLookup } from '../QueryColumn';
import { wrapDraggable } from '../../internal/testHelpers';

import { makeTestQueryModel } from './testUtils';

import {
    ColumnChoice,
    ColumnChoiceGroup,
    ColumnInView,
    CustomizeGridViewModal,
    FieldLabelDisplay,
    includedColumnsForCustomizationFilter,
} from './CustomizeGridViewModal';

const QUERY_COL = new QueryColumn({
    name: 'test/Column',
    fieldKey: 'test$SColumn',
    fieldKeyArray: ['test/Column'],
    fieldKeyPath: 'test$SColumn',
    caption: 'Test Column',
    selectable: true,
});

const QUERY_COL_LOOKUP = new QueryColumn({
    name: 'test/Column',
    fieldKey: 'test$SColumn',
    fieldKeyArray: ['test/Column'],
    fieldKeyPath: 'parent1/parent2/test$SColumn',
    caption: 'Test Column',
    selectable: true,
    lookup: new QueryLookup({}),
});

const QUERY_COL_LOOKUP_ANCESTOR_STANDARD = QueryColumn.create({
    name: 'standard',
    fieldKey: 'standard',
    fieldKeyArray: ['standard'],
    fieldKeyPath: 'Ancestors/parent1/standard',
    caption: 'Test Standard',
    selectable: true,
    lookup: {
        /* this would define the schema/query */
    },
});

const QUERY_COL_LOOKUP_ANCESTOR_MULTIVALUED = QueryColumn.create({
    name: 'multi',
    fieldKey: 'multi',
    fieldKeyArray: ['multi'],
    fieldKeyPath: 'Ancestors/parent1/multi',
    caption: 'Test Multi',
    selectable: true,
    lookup: {
        /* this would define the schema/query */
        multiValued: 'junction',
    },
});

describe('ColumnChoice', () => {
    test('isInView', () => {
        const wrapper = mount(
            <ColumnChoice
                column={QUERY_COL}
                isInView={true}
                onAddColumn={jest.fn()}
                onCollapseColumn={jest.fn()}
                onExpandColumn={jest.fn()}
            />
        );
        expect(wrapper.find('.field-name').text()).toBe('Test Column');
        expect(wrapper.find('.fa-check')).toHaveLength(1);
        expect(wrapper.find('.fa-plus')).toHaveLength(0);
        expect(wrapper.find('.field-expand-icon')).toHaveLength(1);
        expect(wrapper.find('.fa-plus-square')).toHaveLength(0);
        expect(wrapper.find('.fa-plus-minus')).toHaveLength(0);
        wrapper.unmount();
    });

    test('not isInView', () => {
        const wrapper = mount(
            <ColumnChoice
                column={QUERY_COL}
                isInView={false}
                onAddColumn={jest.fn()}
                onCollapseColumn={jest.fn()}
                onExpandColumn={jest.fn()}
            />
        );
        expect(wrapper.find('.field-name').text()).toBe('Test Column');
        expect(wrapper.find('.fa-check')).toHaveLength(0);
        expect(wrapper.find('.fa-plus')).toHaveLength(1);
        expect(wrapper.find('.field-expand-icon')).toHaveLength(1);
        expect(wrapper.find('.fa-plus-square')).toHaveLength(0);
        expect(wrapper.find('.fa-plus-minus')).toHaveLength(0);
        wrapper.unmount();
    });

    test('lookup, collapsed', () => {
        const wrapper = mount(
            <ColumnChoice
                column={QUERY_COL_LOOKUP}
                isInView={false}
                onAddColumn={jest.fn()}
                onCollapseColumn={jest.fn()}
                onExpandColumn={jest.fn()}
            />
        );
        expect(wrapper.find('.field-name').text()).toBe('Test Column');
        expect(wrapper.find('.fa-check')).toHaveLength(0);
        expect(wrapper.find('.fa-plus')).toHaveLength(1);
        expect(wrapper.find('.field-expand-icon')).toHaveLength(3);
        expect(wrapper.find('.fa-plus-square')).toHaveLength(1);
        expect(wrapper.find('.fa-plus-minus')).toHaveLength(0);
        wrapper.unmount();
    });

    test('lookup, expanded', () => {
        const wrapper = mount(
            <ColumnChoice
                column={QUERY_COL_LOOKUP}
                isInView={false}
                isExpanded
                onAddColumn={jest.fn()}
                onCollapseColumn={jest.fn()}
                onExpandColumn={jest.fn()}
            />
        );
        expect(wrapper.find('.field-name').text()).toBe('Test Column');
        expect(wrapper.find('.fa-check')).toHaveLength(0);
        expect(wrapper.find('.fa-plus')).toHaveLength(1);
        expect(wrapper.find('.field-expand-icon')).toHaveLength(3);
        expect(wrapper.find('.fa-plus-square')).toHaveLength(0);
        expect(wrapper.find('.fa-minus-square')).toHaveLength(1);
        wrapper.unmount();
    });
});

describe('ColumnInView', () => {
    function validate(wrapper: ReactWrapper, column: QueryColumn, dragDisabled: boolean) {
        const fieldName = wrapper.find('.field-name');
        expect(fieldName.text()).toBe(column.caption);
        const removeIcon = wrapper.find('.fa-times');
        expect(removeIcon.exists()).toBeTruthy();
        const iconParent = removeIcon.parent();
        expect(iconParent.prop('className')).toContain('view-field__action clickable');
        expect(iconParent.prop('onClick')).toBeDefined();
        if (dragDisabled) {
            expect(wrapper.find(Draggable).prop('isDragDisabled')).toBe(true);
        }
    }

    test('remove enabled', () => {
        const wrapper = mount(
            wrapDraggable(
                <ColumnInView
                    column={QUERY_COL}
                    index={1}
                    onRemoveColumn={jest.fn()}
                    onClick={jest.fn()}
                    selected={undefined}
                    isDragDisabled={false}
                    onEditTitle={jest.fn()}
                    onUpdateTitle={jest.fn()}
                />
            )
        );
        validate(wrapper, QUERY_COL, false);
        wrapper.unmount();
    });

    test('addToDisplayView can be removed', () => {
        const column = new QueryColumn({
            name: 'testColumn',
            fieldKey: 'testColumn',
            fieldKeyArray: ['testColumn'],
            fieldKeyPath: 'testColumn',
            caption: 'Test Column',
        });

        const wrapper = mount(
            wrapDraggable(
                <ColumnInView
                    column={column}
                    index={1}
                    onRemoveColumn={jest.fn()}
                    onClick={jest.fn}
                    selected={undefined}
                    isDragDisabled={false}
                    onEditTitle={jest.fn()}
                    onUpdateTitle={jest.fn()}
                />
            )
        );
        validate(wrapper, column, false);
        wrapper.unmount();
    });

    test('drag disabled', () => {
        const column = new QueryColumn({
            name: 'testColumn',
            fieldKey: 'testColumn',
            fieldKeyArray: ['testColumn'],
            fieldKeyPath: 'testColumn',
            caption: 'Test Column',
        });

        const wrapper = mount(
            wrapDraggable(
                <ColumnInView
                    column={column}
                    index={1}
                    onRemoveColumn={jest.fn()}
                    onClick={jest.fn}
                    selected={undefined}
                    isDragDisabled={true}
                    onEditTitle={jest.fn()}
                    onUpdateTitle={jest.fn()}
                />
            )
        );
        validate(wrapper, column, false);
        wrapper.unmount();
    });

    test('Editing', () => {
        const column = new QueryColumn({
            name: 'testColumn',
            fieldKey: 'testColumn',
            fieldKeyArray: ['testColumn'],
            fieldKeyPath: 'testColumn',
            caption: 'Test Column',
        });

        const wrapper = mount(
            wrapDraggable(
                <ColumnInView
                    column={column}
                    index={1}
                    onRemoveColumn={jest.fn()}
                    onClick={jest.fn}
                    selected={undefined}
                    isDragDisabled={true}
                    onEditTitle={jest.fn()}
                    onUpdateTitle={jest.fn()}
                />
            )
        );
        wrapper.find('.fa-pencil').simulate('click');
        expect(wrapper.find('.fa-pencil').exists()).toBeFalsy();
        expect(wrapper.find('input').exists()).toBe(true);
        wrapper.unmount();
    });
});

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
    const columns = fromJS({
        field$s1: FIELD_1_COL,
        'field+2': FIELD_2_COL,
        field3: FIELD_3_COL,
        systemCol: SYSTEM_COL,
        hiddenCol: HIDDEN_COL,
    });

    const QUERY_NAME = 'queryTest';

    test('With title, no view', () => {
        const view = ViewInfo.create({ name: 'default' });
        const queryInfo = QueryInfo.create({
            views: fromJS({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
            columns,
        });
        let model = makeTestQueryModel(new SchemaQuery('test', QUERY_NAME), queryInfo);
        model = model.mutate({ title: 'Title' });
        const wrapper = mount(<CustomizeGridViewModal model={model} onCancel={jest.fn()} onUpdate={jest.fn()} />);
        expect(wrapper.find(Modal.Title).text()).toBe('Customize Title Grid');
        wrapper.unmount();
    });

    test('Without title, with view name', () => {
        const viewName = 'viewForTesting';
        const view = ViewInfo.create({ name: viewName });
        const queryInfo = QueryInfo.create({
            views: fromJS({ [viewName.toLowerCase()]: view }),
            columns,
        });
        const model = makeTestQueryModel(new SchemaQuery('test', QUERY_NAME, viewName), queryInfo);
        const wrapper = mount(<CustomizeGridViewModal model={model} onCancel={jest.fn()} onUpdate={jest.fn()} />);
        expect(wrapper.find(Modal.Title).text()).toBe('Customize ' + QUERY_NAME + ' Grid - ' + viewName);
        wrapper.unmount();
    });

    test('Columns in View and All Fields,', () => {
        const view = ViewInfo.create({
            name: ViewInfo.DEFAULT_NAME,
            columns: [FIELD_1_COL, FIELD_2_COL],
        });
        const queryInfo = QueryInfo.create({
            views: fromJS({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
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
        const view = ViewInfo.create({
            name: ViewInfo.DEFAULT_NAME,
            columns: [FIELD_1_COL, FIELD_2_COL],
        });
        const queryInfo = QueryInfo.create({
            views: fromJS({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
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
        colsInView.at(0).find('.field-name').simulate('click');
        colsInView = wrapper.find(ColumnInView);
        expect(colsInView.at(0).prop('selected')).toBe(true);
        expect(colsInView.at(1).prop('selected')).toBe(false);

        // clicking on the same column should unselect
        colsInView.at(0).find('.field-name').simulate('click');
        colsInView = wrapper.find(ColumnInView);
        expect(colsInView.at(0).prop('selected')).toBe(false);
        expect(colsInView.at(1).prop('selected')).toBe(false);
    });
});

describe('FieldLabelDisplay', () => {
    test('not lookup', () => {
        const wrapper = mount(<FieldLabelDisplay column={QUERY_COL} includeFieldKey />);
        expect(wrapper.find('.field-name')).toHaveLength(1);
        expect(wrapper.find('.field-name').text()).toBe(QUERY_COL.caption);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);
        expect(wrapper.find('input')).toHaveLength(0);
        wrapper.unmount();
    });

    test('is lookup', () => {
        const wrapper = mount(<FieldLabelDisplay column={QUERY_COL_LOOKUP} includeFieldKey />);
        expect(wrapper.find('.field-name')).toHaveLength(1);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(1);
        expect(wrapper.find('input')).toHaveLength(0);
        wrapper.unmount();
    });

    test('is lookup, do not include fieldKey', () => {
        const wrapper = mount(<FieldLabelDisplay column={QUERY_COL_LOOKUP} />);
        expect(wrapper.find('.field-name')).toHaveLength(1);
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);
        expect(wrapper.find('input')).toHaveLength(0);

        wrapper.unmount();
    });

    test('is editing', () => {
        const wrapper = mount(<FieldLabelDisplay column={QUERY_COL} editing />);
        expect(wrapper.find('input')).toHaveLength(1);
        expect(wrapper.find('input').prop('defaultValue')).toBe(QUERY_COL.caption);
        wrapper.unmount();
    });
});

describe('ColumnChoiceGroup', () => {
    const DEFAULT_PROPS = {
        column: QUERY_COL,
        columnsInView: [],
        expandedColumns: {},
        showAllColumns: false,
        onAddColumn: jest.fn(),
        onCollapseColumn: jest.fn(),
        onExpandColumn: jest.fn(),
    };

    function validate(wrapper: ReactWrapper, expanded = false, inView = false, hasChild = false): void {
        const count = hasChild ? 2 : 1;
        expect(wrapper.find(ColumnChoice)).toHaveLength(count);
        expect(wrapper.find(ColumnChoice).first().prop('isExpanded')).toBe(expanded);
        expect(wrapper.find(ColumnChoice).first().prop('isInView')).toBe(inView);
        expect(wrapper.find(ColumnChoiceGroup)).toHaveLength(count);
    }

    test('standard column, not lookup, no in view', () => {
        const wrapper = mount(<ColumnChoiceGroup {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('standard column, not lookup, in view', () => {
        const wrapper = mount(<ColumnChoiceGroup {...DEFAULT_PROPS} columnsInView={[QUERY_COL]} />);
        validate(wrapper, false, true);
        wrapper.unmount();
    });

    test('lookup column, collapsed, not in view', () => {
        const wrapper = mount(<ColumnChoiceGroup {...DEFAULT_PROPS} column={QUERY_COL_LOOKUP} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('lookup column, expanded, in view', () => {
        const wrapper = mount(
            <ColumnChoiceGroup
                {...DEFAULT_PROPS}
                column={QUERY_COL_LOOKUP}
                expandedColumns={{ [QUERY_COL_LOOKUP.index]: QueryInfo.create({}) }}
                columnsInView={[QUERY_COL_LOOKUP]}
            />
        );
        validate(wrapper, true, true);
        wrapper.unmount();
    });

    test('lookup column with children, child not in view', () => {
        const queryInfo = QueryInfo.create({ columns: fromJS({ [QUERY_COL.fieldKey]: QUERY_COL }) });
        const wrapper = mount(
            <ColumnChoiceGroup
                {...DEFAULT_PROPS}
                column={QUERY_COL_LOOKUP}
                expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                columnsInView={[QUERY_COL_LOOKUP]}
            />
        );
        validate(wrapper, true, true, true);
        expect(wrapper.find(ColumnChoice).last().prop('isExpanded')).toBe(false);
        expect(wrapper.find(ColumnChoice).last().prop('isInView')).toBe(false);
        wrapper.unmount();
    });

    test('lookup column with children, child in view', () => {
        const queryInfo = QueryInfo.create({ columns: fromJS({ [QUERY_COL.fieldKey]: QUERY_COL }) });
        const wrapper = mount(
            <ColumnChoiceGroup
                {...DEFAULT_PROPS}
                column={QUERY_COL_LOOKUP}
                expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                columnsInView={[QUERY_COL_LOOKUP, QUERY_COL]}
            />
        );
        validate(wrapper, true, true, true);
        expect(wrapper.find(ColumnChoice).last().prop('isExpanded')).toBe(false);
        expect(wrapper.find(ColumnChoice).last().prop('isInView')).toBe(true);
        wrapper.unmount();
    });

    test('lookup column with children, child hidden', () => {
        const colHidden = new QueryColumn({ ...QUERY_COL, hidden: true });
        const queryInfo = QueryInfo.create({ columns: fromJS({ [colHidden.fieldKey]: colHidden }) });
        const wrapper = mount(
            <ColumnChoiceGroup
                {...DEFAULT_PROPS}
                column={QUERY_COL_LOOKUP}
                expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                columnsInView={[QUERY_COL_LOOKUP]}
            />
        );
        validate(wrapper, true, true);
        wrapper.unmount();
    });

    test('lookup column with children, child hidden with showAllColumns', () => {
        const colHidden = new QueryColumn({ ...QUERY_COL, hidden: true });
        const queryInfo = QueryInfo.create({ columns: fromJS({ [colHidden.fieldKey]: colHidden }) });
        const wrapper = mount(
            <ColumnChoiceGroup
                {...DEFAULT_PROPS}
                column={QUERY_COL_LOOKUP}
                expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                columnsInView={[QUERY_COL_LOOKUP, colHidden]}
                showAllColumns
            />
        );
        validate(wrapper, true, true, true);
        expect(wrapper.find(ColumnChoice).last().prop('isExpanded')).toBe(false);
        expect(wrapper.find(ColumnChoice).last().prop('isInView')).toBe(true);
        wrapper.unmount();
    });

    test('lookup column with children, child removeFromViews', () => {
        const colHidden = new QueryColumn({ ...QUERY_COL, removeFromViews: true });
        const queryInfo = QueryInfo.create({ columns: fromJS({ [colHidden.fieldKey]: colHidden }) });
        const wrapper = mount(
            <ColumnChoiceGroup
                {...DEFAULT_PROPS}
                column={QUERY_COL_LOOKUP}
                expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                columnsInView={[QUERY_COL_LOOKUP]}
            />
        );
        validate(wrapper, true, true);
        wrapper.unmount();
    });

    test('lookup column, ancestor expanded', () => {
        const queryInfo = QueryInfo.create({
            columns: fromJS({
                [QUERY_COL_LOOKUP_ANCESTOR_STANDARD.fieldKey]: QUERY_COL_LOOKUP_ANCESTOR_STANDARD,
                [QUERY_COL_LOOKUP_ANCESTOR_MULTIVALUED.fieldKey]: QUERY_COL_LOOKUP_ANCESTOR_MULTIVALUED,
            }),
        });
        const wrapper = mount(
            <ColumnChoiceGroup
                {...DEFAULT_PROPS}
                column={QUERY_COL_LOOKUP}
                expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                columnsInView={[QUERY_COL_LOOKUP]}
                showAllColumns
            />
        );
        validate(wrapper, true, true, true);
        expect(wrapper.find('.list-group-item')).toHaveLength(2);
        expect(wrapper.find('.list-group-item').first().text()).toBe('Test Column');
        expect(wrapper.find('.list-group-item').last().text()).toBe('Test Standard');
        wrapper.unmount();
    });
});

describe('includedColumnsForCustomizationFilter', () => {
    test('hidden', () => {
        let col = new QueryColumn({ name: 'testColumn', hidden: false });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeTruthy;
        expect(includedColumnsForCustomizationFilter(col, true)).toBeTruthy;

        col = new QueryColumn({ name: 'testColumn', hidden: true });
        expect(includedColumnsForCustomizationFilter(col, false)).toBeFalsy();
        expect(includedColumnsForCustomizationFilter(col, true)).toBeTruthy;
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
});
