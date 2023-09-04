import React from 'react';

import { mount, ReactWrapper } from 'enzyme';

import { OverlayTrigger } from 'react-bootstrap';

import { Draggable } from 'react-beautiful-dnd';

import { ExtendedMap } from '../../public/ExtendedMap';

import { QueryInfo } from '../../public/QueryInfo';
import { QueryColumn, QueryLookup } from '../../public/QueryColumn';
import { wrapDraggable } from '../test/testHelpers';

import {
    ColumnChoice,
    ColumnChoiceGroup,
    ColumnInView,
    ColumnInViewProps,
    FieldLabelDisplay,
} from './ColumnSelectionModal';

describe('ColumnSelectionModal', () => {
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
        function defaultProps(): ColumnInViewProps {
            return {
                allowEdit: true,
                column: QUERY_COL,
                index: 1,
                isDragDisabled: false,
                onEditTitle: jest.fn(),
                onClick: jest.fn(),
                onRemoveColumn: jest.fn(),
                onUpdateTitle: jest.fn(),
                selected: false,
            };
        }

        function validate(wrapper: ReactWrapper, column: QueryColumn, dragDisabled: boolean): void {
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
            const wrapper = mount(wrapDraggable(<ColumnInView {...defaultProps()} />));
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

            const wrapper = mount(wrapDraggable(<ColumnInView {...defaultProps()} column={column} />));
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

            const wrapper = mount(wrapDraggable(<ColumnInView {...defaultProps()} column={column} isDragDisabled />));

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

            const wrapper = mount(wrapDraggable(<ColumnInView {...defaultProps()} column={column} isDragDisabled />));

            wrapper.find('.fa-pencil').simulate('click');
            expect(wrapper.find('.fa-pencil').exists()).toBeFalsy();
            expect(wrapper.find('input').exists()).toBe(true);
            wrapper.unmount();
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
                    expandedColumns={{ [QUERY_COL_LOOKUP.index]: new QueryInfo({}) }}
                    columnsInView={[QUERY_COL_LOOKUP]}
                />
            );
            validate(wrapper, true, true);
            wrapper.unmount();
        });

        test('lookup column with children, child not in view', () => {
            const queryInfo = new QueryInfo({ columns: new ExtendedMap({ [QUERY_COL.fieldKey]: QUERY_COL }) });
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
            const queryInfo = new QueryInfo({ columns: new ExtendedMap({ [QUERY_COL.fieldKey]: QUERY_COL }) });
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
            const queryInfo = new QueryInfo({ columns: new ExtendedMap({ [colHidden.fieldKey]: colHidden }) });
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
            const queryInfo = new QueryInfo({ columns: new ExtendedMap({ [colHidden.fieldKey]: colHidden }) });
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
            const queryInfo = new QueryInfo({ columns: new ExtendedMap({ [colHidden.fieldKey]: colHidden }) });
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
            const QUERY_COL_LOOKUP_ANCESTOR_STANDARD = new QueryColumn({
                name: 'standard',
                fieldKey: 'standard',
                fieldKeyArray: ['standard'],
                fieldKeyPath: 'Ancestors/parent1/standard',
                caption: 'Test Standard',
                selectable: true,
                lookup: new QueryLookup({}),
            });

            const QUERY_COL_LOOKUP_ANCESTOR_MULTIVALUED = new QueryColumn({
                name: 'multi',
                fieldKey: 'multi',
                fieldKeyArray: ['multi'],
                fieldKeyPath: 'Ancestors/parent1/multi',
                caption: 'Test Multi',
                selectable: true,
                lookup: new QueryLookup({ multiValued: 'junction' }),
            });

            const queryInfo = new QueryInfo({
                columns: new ExtendedMap({
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

    describe('ColumnSelectionModal', () => {
        // TODO: Unit tests
    });
});
