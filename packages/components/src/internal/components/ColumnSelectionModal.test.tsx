import React, { act } from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { ExtendedMap } from '../../public/ExtendedMap';

import { QueryInfo } from '../../public/QueryInfo';
import { QueryColumn, QueryLookup } from '../../public/QueryColumn';
import { wrapDraggable } from '../test/testHelpers';

import {
    ColumnChoice,
    ColumnChoiceProps,
    ColumnChoiceGroup,
    ColumnChoiceGroupProps,
    ColumnInView,
    ColumnInViewProps,
    ColumnSelectionModal,
    ColumnSelectionModalProps,
    FieldLabelDisplay,
} from './ColumnSelectionModal';

describe('ColumnSelectionModal', () => {
    const QUERY_COL = new QueryColumn({
        caption: 'Test Column',
        fieldKey: 'test$SColumn',
        fieldKeyArray: ['test/Column'],
        fieldKeyPath: 'test$SColumn',
        name: 'test/Column',
        selectable: true,
    });

    const QUERY_COL_LOOKUP = new QueryColumn({
        caption: 'Test Column',
        fieldKey: 'test$SColumn',
        fieldKeyArray: ['test/Column'],
        fieldKeyPath: 'parent1/parent2/test$SColumn',
        lookup: new QueryLookup({}),
        name: 'test/Column',
        selectable: true,
    });

    describe('ColumnChoice', () => {
        function defaultProps(): ColumnChoiceProps {
            return {
                column: QUERY_COL,
                onAddColumn: jest.fn(),
                onCollapseColumn: jest.fn(),
                onExpandColumn: jest.fn(),
            };
        }

        test('isInView', () => {
            render(<ColumnChoice {...defaultProps()} isInView />);
            expect(document.querySelector('.field-name').textContent).toBe('Test Column');
            expect(document.querySelectorAll('.fa-check')).toHaveLength(1);
            expect(document.querySelectorAll('.fa-plus')).toHaveLength(0);
            expect(document.querySelectorAll('.field-expand-icon')).toHaveLength(1);
            expect(document.querySelectorAll('.fa-chevron-right')).toHaveLength(0);
            expect(document.querySelectorAll('.fa-chevron-down')).toHaveLength(0);
        });

        test('not isInView', () => {
            render(<ColumnChoice {...defaultProps()} isInView={false} />);
            expect(document.querySelector('.field-name').textContent).toBe('Test Column');
            expect(document.querySelectorAll('.fa-check')).toHaveLength(0);
            expect(document.querySelectorAll('.fa-plus')).toHaveLength(1);
            expect(document.querySelectorAll('.field-expand-icon')).toHaveLength(1);
            expect(document.querySelectorAll('.fa-chevron-right')).toHaveLength(0);
            expect(document.querySelectorAll('.fa-chevron-down')).toHaveLength(0);
        });

        test('lookup, collapsed', () => {
            render(<ColumnChoice {...defaultProps()} column={QUERY_COL_LOOKUP} isInView={false} />);
            expect(document.querySelector('.field-name').textContent).toBe('Test Column');
            expect(document.querySelectorAll('.fa-check')).toHaveLength(0);
            expect(document.querySelectorAll('.fa-plus')).toHaveLength(1);
            expect(document.querySelectorAll('.field-expand-icon')).toHaveLength(3);
            expect(document.querySelectorAll('.fa-chevron-right')).toHaveLength(1);
            expect(document.querySelectorAll('.fa-chevron-down')).toHaveLength(0);
        });

        test('lookup, expanded', () => {
            render(
                <ColumnChoice {...defaultProps()} column={QUERY_COL_LOOKUP} isExpanded isInView={false} />
            );
            expect(document.querySelector('.field-name').textContent).toBe('Test Column');
            expect(document.querySelectorAll('.fa-check')).toHaveLength(0);
            expect(document.querySelectorAll('.fa-plus')).toHaveLength(1);
            expect(document.querySelectorAll('.field-expand-icon')).toHaveLength(3);
            expect(document.querySelectorAll('.fa-chevron-right')).toHaveLength(0);
            expect(document.querySelectorAll('.fa-chevron-down')).toHaveLength(1);
        });

        test('disabled', () => {
            render(
                <ColumnChoice {...defaultProps()} disabledMsg="Disabled, please." isInView={false} />
            );
            const addIcon = document.querySelector('.fa-plus');
            const addIconParent = addIcon.parentElement;
            expect(addIconParent.className).toContain('disabled');
            expect(addIconParent.title).toBe('');
        });
    });

    describe('ColumnInView', () => {
        function defaultProps(): ColumnInViewProps {
            return {
                allowEditLabel: true,
                column: QUERY_COL,
                disableDelete: false,
                index: 1,
                isDragDisabled: false,
                onEditTitle: jest.fn(),
                onClick: jest.fn(),
                onRemoveColumn: jest.fn(),
                onUpdateTitle: jest.fn(),
                selected: false,
            };
        }

        function validate(column: QueryColumn, deleteDisabled: boolean): void {
            expect(document.querySelector('.field-name span').textContent).toBe(column.caption);
            const removeIcon = document.querySelector('.fa-times');
            if (deleteDisabled) {
                expect(removeIcon).toBeFalsy();
            } else {
                expect(removeIcon).toBeTruthy();
                const iconParent = removeIcon.parentElement;
                expect(iconParent.className).toContain('view-field__action clickable');
                expect(iconParent.onclick).toBeDefined();
            }
        }

        test('remove enabled', () => {
            render(wrapDraggable(<ColumnInView {...defaultProps()} />));
            validate(QUERY_COL, false);
        });

        test('delete disabled', () => {
            render(wrapDraggable(<ColumnInView {...defaultProps()} disableDelete />));
            validate(QUERY_COL, true);
        });

        test('addToDisplayView can be removed', () => {
            const column = new QueryColumn({
                name: 'testColumn',
                fieldKey: 'testColumn',
                fieldKeyArray: ['testColumn'],
                fieldKeyPath: 'testColumn',
                caption: 'Test Column',
            });

            render(wrapDraggable(<ColumnInView {...defaultProps()} column={column} />));
            validate(column, false);
        });

        test('drag disabled', () => {
            const column = new QueryColumn({
                name: 'testColumn',
                fieldKey: 'testColumn',
                fieldKeyArray: ['testColumn'],
                fieldKeyPath: 'testColumn',
                caption: 'Test Column',
            });

            render(wrapDraggable(<ColumnInView {...defaultProps()} column={column} isDragDisabled />));
            validate(column, false);
        });

        test('Editing column labels', async () => {
            const column = new QueryColumn({
                name: 'testColumn',
                fieldKey: 'testColumn',
                fieldKeyArray: ['testColumn'],
                fieldKeyPath: 'testColumn',
                caption: 'Test Column',
            });

            render(
                wrapDraggable(<ColumnInView {...defaultProps()} allowEditLabel column={column} isDragDisabled />)
            );

            await userEvent.click(document.querySelector('.fa-pencil'));
            expect(document.querySelector('.fa-pencil')).toBeFalsy();
            expect(document.querySelectorAll('input')).toHaveLength(1);
        });
    });

    describe('FieldLabelDisplay', () => {
        test('not lookup', () => {
            render(<FieldLabelDisplay column={QUERY_COL} includeFieldKey />);
            expect(document.querySelector('.field-name span').textContent).toBe(QUERY_COL.caption);
            expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
            expect(document.querySelectorAll('input')).toHaveLength(0);
        });

        test('is lookup', () => {
            render(<FieldLabelDisplay column={QUERY_COL_LOOKUP} includeFieldKey />);
            expect(document.querySelectorAll('.field-name span')).toHaveLength(1);
            expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
            expect(document.querySelectorAll('input')).toHaveLength(0);
        });

        test('is lookup, do not include fieldKey', () => {
            render(<FieldLabelDisplay column={QUERY_COL_LOOKUP} />);
            expect(document.querySelectorAll('.field-name')).toHaveLength(1);
            expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(0);
            expect(document.querySelectorAll('input')).toHaveLength(0);
        });

        test('is editing', () => {
            render(<FieldLabelDisplay column={QUERY_COL} editing />);
            const inputs = document.querySelectorAll('input');
            expect(inputs).toHaveLength(1);
            expect(inputs[0].value).toBe(QUERY_COL.caption);
        });
    });

    describe('ColumnChoiceGroup', () => {
        function defaultProps(): ColumnChoiceGroupProps {
            return {
                column: QUERY_COL,
                columnsInView: [],
                expandedColumns: {},
                onAddColumn: jest.fn(),
                onCollapseColumn: jest.fn(),
                onExpandColumn: jest.fn(),
                showAllColumns: false,
            };
        }

        function validate(expanded = false, inView = false, hasChild = false): void {
            const count = hasChild ? 2 : 1;
            const columnChoices = document.querySelectorAll('.list-group-item');
            expect(columnChoices).toHaveLength(count);

            const downArrow = columnChoices[0].querySelector('.fa-chevron-down');
            if (expanded) {
                expect(downArrow).toBeTruthy();
            } else {
                expect(downArrow).toBeFalsy();
            }

            const viewField = columnChoices[0].querySelector(
                '.view-field__action[title="This field is included in the view."]'
            );
            if (inView) {
                expect(viewField).toBeTruthy();
            } else {
                expect(viewField).toBeFalsy();
            }
        }

        test('standard column, not lookup, no in view', () => {
            render(<ColumnChoiceGroup {...defaultProps()} />);
            validate();
        });

        test('standard column, not lookup, in view', () => {
            render(<ColumnChoiceGroup {...defaultProps()} columnsInView={[QUERY_COL]} />);
            validate(false, true);
        });

        test('lookup column, collapsed, not in view', () => {
            render(<ColumnChoiceGroup {...defaultProps()} column={QUERY_COL_LOOKUP} />);
            validate();
        });

        test('lookup column, expanded, in view', () => {
            render(
                <ColumnChoiceGroup
                    {...defaultProps()}
                    column={QUERY_COL_LOOKUP}
                    expandedColumns={{ [QUERY_COL_LOOKUP.index]: new QueryInfo({}) }}
                    columnsInView={[QUERY_COL_LOOKUP]}
                />
            );
            validate(true, true);
        });

        test('lookup column with children, child not in view', () => {
            const queryInfo = new QueryInfo({ columns: new ExtendedMap({ [QUERY_COL.fieldKey]: QUERY_COL }) });
            render(
                <ColumnChoiceGroup
                    {...defaultProps()}
                    column={QUERY_COL_LOOKUP}
                    expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                    columnsInView={[QUERY_COL_LOOKUP]}
                />
            );
            validate(true, true, true);
        });

        test('lookup column with children, child in view', () => {
            const queryInfo = new QueryInfo({ columns: new ExtendedMap({ [QUERY_COL.fieldKey]: QUERY_COL }) });
            render(
                <ColumnChoiceGroup
                    {...defaultProps()}
                    column={QUERY_COL_LOOKUP}
                    expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                    columnsInView={[QUERY_COL_LOOKUP, QUERY_COL]}
                />
            );
            validate(true, true, true);
        });

        test('lookup column with children, child hidden', () => {
            const colHidden = new QueryColumn({ ...QUERY_COL, hidden: true });
            const queryInfo = new QueryInfo({ columns: new ExtendedMap({ [colHidden.fieldKey]: colHidden }) });
            render(
                <ColumnChoiceGroup
                    {...defaultProps()}
                    column={QUERY_COL_LOOKUP}
                    columnsInView={[QUERY_COL_LOOKUP]}
                    expandedColumnFilter={jest.fn().mockImplementation(c => !c.hidden)}
                    expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                />
            );
            validate(true, true);
        });

        test('lookup column with children, child hidden with showAllColumns', () => {
            const colHidden = new QueryColumn({ ...QUERY_COL, hidden: true });
            const queryInfo = new QueryInfo({ columns: new ExtendedMap({ [colHidden.fieldKey]: colHidden }) });
            render(
                <ColumnChoiceGroup
                    {...defaultProps()}
                    column={QUERY_COL_LOOKUP}
                    expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                    columnsInView={[QUERY_COL_LOOKUP, colHidden]}
                    showAllColumns
                />
            );
            validate(true, true, true);
        });

        test('lookup column with children, child removeFromViews', () => {
            const colHidden = new QueryColumn({ ...QUERY_COL, removeFromViews: true });
            const queryInfo = new QueryInfo({ columns: new ExtendedMap({ [colHidden.fieldKey]: colHidden }) });
            render(
                <ColumnChoiceGroup
                    {...defaultProps()}
                    column={QUERY_COL_LOOKUP}
                    expandedColumnFilter={jest.fn().mockImplementation(c => !c.removeFromViews)}
                    expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                    columnsInView={[QUERY_COL_LOOKUP]}
                />
            );
            validate(true, true);
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

            render(
                <ColumnChoiceGroup
                    {...defaultProps()}
                    column={QUERY_COL_LOOKUP}
                    expandedColumnFilter={jest.fn().mockImplementation(c => !c.isJunctionLookup())}
                    expandedColumns={{ [QUERY_COL_LOOKUP.index]: queryInfo }}
                    columnsInView={[QUERY_COL_LOOKUP]}
                    showAllColumns
                />
            );
            validate(true, true, true);
            expect(document.querySelectorAll('.list-group-item')).toHaveLength(2);
        });
    });

    describe('ColumnSelectionModal', () => {
        const QUERY_INFO = new QueryInfo({ columns: new ExtendedMap({ [QUERY_COL.fieldKey]: QUERY_COL }) });

        function defaultProps(): ColumnSelectionModalProps {
            return {
                initialSelectedColumns: [QUERY_COL],
                onSubmit: jest.fn(),
                queryInfo: QUERY_INFO,
            };
        }

        test('default props', () => {
            render(<ColumnSelectionModal {...defaultProps()} />);
            const titles = document.querySelectorAll('.field-modal__col-title');
            expect(titles).toHaveLength(2);

            expect(document.querySelectorAll('.list-group-item')).toHaveLength(2);
            expect(titles[0].textContent).toContain('Available Fields');
            expect(titles[1].textContent).toContain('Selected Fields');
            expect(document.querySelector('.field-modal__footer')).toBeFalsy();
        });

        test('loading initialization', () => {
            render(<ColumnSelectionModal {...defaultProps()} isLoaded={false} />);

            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
            expect(document.querySelectorAll('.list-group-item')).toHaveLength(0);
        });

        test('loaded', () => {
            render(
                <ColumnSelectionModal
                    {...defaultProps()}
                    initialSelectedColumn={QUERY_COL}
                    initialSelectedColumns={[QUERY_COL]}
                    isLoaded
                />
            );

            expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
            expect(document.querySelectorAll('.list-group-item')).toHaveLength(2);

            // verify useEffect initialization of selectedIndex, selectedColumns
            expect(document.querySelectorAll('.list-group-item.active')).toHaveLength(1);
        });
    });
});
