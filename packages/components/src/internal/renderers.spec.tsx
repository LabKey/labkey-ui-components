import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Filter } from '@labkey/api';

import { ExtendedMap } from '../public/ExtendedMap';

import { QueryColumn } from '../public/QueryColumn';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';

import { SchemaQuery } from '../public/SchemaQuery';

import { QuerySort } from '../public/QuerySort';

import { QueryInfo } from '../public/QueryInfo';

import { EditableColumnTitle, HeaderCellDropdown, isFilterColumnNameMatch } from './renderers';
import { GridColumn } from './components/base/models/GridColumn';
import { LabelHelpTip } from './components/base/LabelHelpTip';
import { ViewInfo } from './ViewInfo';
import { DisableableMenuItem } from './components/samples/DisableableMenuItem';

describe('isFilterColumnNameMatch', () => {
    const filter = Filter.create('Column', 'Value');

    test('by column name', () => {
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ name: '' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ name: 'column' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ name: ' Column ' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ name: 'Column' }))).toBeTruthy();
    });

    test('by fieldKey', () => {
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ fieldKey: '' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ fieldKey: 'column' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ fieldKey: ' Column ' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ fieldKey: 'Column' }))).toBeTruthy();
    });

    test('lookup fieldKey', () => {
        const lkFilter = Filter.create('Column/Lookup', 'Value');
        expect(
            isFilterColumnNameMatch(lkFilter, new QueryColumn({ fieldKey: 'Column', lookup: { displayColumn: '' } }))
        ).toBeFalsy();
        expect(
            isFilterColumnNameMatch(
                lkFilter,
                new QueryColumn({ fieldKey: 'Column', lookup: { displayColumn: 'lookup' } })
            )
        ).toBeFalsy();
        expect(
            isFilterColumnNameMatch(
                lkFilter,
                new QueryColumn({ fieldKey: 'Column', lookup: { displayColumn: 'Lookup' } })
            )
        ).toBeTruthy();
    });
});

describe('HeaderCellDropdown', () => {
    const DEFAULT_PROPS = {
        i: 0,
        column: new GridColumn({
            index: 'column',
            title: 'Column',
            raw: new QueryColumn({ fieldKey: 'column', sortable: true, filterable: true }),
        }),
        model: makeTestQueryModel(new SchemaQuery('schema', 'query')),
        handleSort: jest.fn,
        handleFilter: jest.fn,
    };

    function validate(wrapper: ReactWrapper, gridColHeaderIcons: number, menuItemCount: number): void {
        expect(wrapper.find('.grid-panel__col-header-icon')).toHaveLength(gridColHeaderIcons);
        expect(wrapper.find(LabelHelpTip)).toHaveLength(0);
        expect(wrapper.find('.dropdown-menu')).toHaveLength(menuItemCount > 0 ? 1 : 0);
        expect(wrapper.find('.grid-panel__menu-toggle .fa-chevron-circle-down')).toHaveLength(
            menuItemCount > 0 ? 1 : 0
        );
        expect(wrapper.find('MenuItem')).toHaveLength(menuItemCount);
    }

    test('default props', () => {
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} />);
        validate(wrapper, 0, 5);
        // 3 with icons, 2 with spacers, and 1 menu separators
        expect(wrapper.find('.grid-panel__menu-icon')).toHaveLength(3);
        expect(wrapper.find('.grid-panel__menu-icon-spacer')).toHaveLength(2);
        // the two remove/clear options should be disabled
        const menuItems = wrapper.find('MenuItem');
        const removeFilterItem = menuItems.at(1);
        expect(removeFilterItem.text()).toContain('Remove filter');
        expect(removeFilterItem.prop('disabled')).toBe(true);
        const clearSortItem = menuItems.at(4);
        expect(clearSortItem.text()).toContain('Clear sort');
        expect(clearSortItem.prop('disabled')).toBe(true);
        // sort asc and sort desc should be enabled
        const sortAscItem = menuItems.at(2);
        expect(sortAscItem.text()).toContain('Sort ascending');
        expect(sortAscItem.prop('disabled')).toBe(false);
        const sortDescItem = menuItems.at(3);
        expect(sortDescItem.text()).toContain('Sort descending');
        expect(sortDescItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('no col', () => {
        const wrapper = mount(
            <HeaderCellDropdown {...DEFAULT_PROPS} column={new GridColumn({ index: 'column', title: 'Column' })} />
        );
        expect(wrapper.find('span')).toHaveLength(0);
        wrapper.unmount();
    });

    test('column not sortable or filterable', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: false }),
                    })
                }
            />
        );
        validate(wrapper, 0, 0);
        wrapper.unmount();
    });

    test('column not sortable or filterable but customizable', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: false }),
                    })
                }
                handleAddColumn={jest.fn}
                handleHideColumn={jest.fn}
            />
        );
        validate(wrapper, 0, 3);
        wrapper.unmount();
    });

    test('column not sortable or filterable, can add and hide', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: false }),
                    })
                }
                handleAddColumn={jest.fn}
                handleHideColumn={jest.fn}
            />
        );
        validate(wrapper, 0, 3);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(1);
        expect(wrapper.find(DisableableMenuItem).text()).toContain('Hide Column');
        expect(wrapper.find(DisableableMenuItem).prop('operationPermitted')).toBe(true);
        wrapper.unmount();
    });

    test('column not sortable or filterable, can add but not hide', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: false }),
                    })
                }
                handleAddColumn={jest.fn}
                handleHideColumn={undefined}
            />
        );
        validate(wrapper, 0, 3);
        expect(wrapper.find(DisableableMenuItem)).toHaveLength(1);
        expect(wrapper.find(DisableableMenuItem).text()).toContain('Hide Column');
        expect(wrapper.find(DisableableMenuItem).prop('operationPermitted')).toBe(undefined);
        wrapper.unmount();
    });

    test('column sortable, not filterable', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: true, filterable: false }),
                    })
                }
            />
        );
        validate(wrapper, 0, 3);
        wrapper.unmount();
    });

    test('column sortable, not filterable, customizable', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: true, filterable: false }),
                    })
                }
                handleHideColumn={jest.fn}
            />
        );
        validate(wrapper, 0, 5);
        wrapper.unmount();
    });

    test('column filterable, not sortable', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: true }),
                    })
                }
            />
        );
        validate(wrapper, 0, 2);
        wrapper.unmount();
    });

    test('column filterable, not sortable, but customizable', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: true }),
                    })
                }
                handleHideColumn={jest.fn}
            />
        );
        validate(wrapper, 0, 4);
        wrapper.unmount();
    });

    test('without handleSort and handleFilter', () => {
        const wrapper = mount(
            <HeaderCellDropdown {...DEFAULT_PROPS} handleSort={undefined} handleFilter={undefined} />
        );
        validate(wrapper, 0, 0);
        wrapper.unmount();
    });

    test('isSortAsc', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            sorts: [new QuerySort({ fieldKey: 'column', dir: '' })],
        });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 5);
        expect(wrapper.find('.fa-filter')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(2);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(1);
        const sortAscItem = wrapper.find('MenuItem').at(2);
        expect(sortAscItem.text()).toContain('Sort ascending');
        expect(sortAscItem.prop('disabled')).toBe(true);
        const sortDescItem = wrapper.find('MenuItem').at(3);
        expect(sortDescItem.text()).toContain('Sort descending');
        expect(sortDescItem.prop('disabled')).toBe(false);
        const clearSortItem = wrapper.find('MenuItem').at(4);
        expect(clearSortItem.text()).toContain('Clear sort');
        expect(clearSortItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('isSortAsc via view sort', () => {
        const sortObj = { fieldKey: 'column', dir: '+' };
        const view = ViewInfo.fromJson({ sort: [sortObj] });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap<string, ViewInfo>({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });

        const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo).mutate({
            sorts: [],
        });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 5);
        expect(wrapper.find('.fa-filter')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(2);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(1);
        const sortAscItem = wrapper.find('MenuItem').at(2);
        expect(sortAscItem.text()).toContain('Sort ascending');
        expect(sortAscItem.prop('disabled')).toBe(true);
        const sortDescItem = wrapper.find('MenuItem').at(3);
        expect(sortDescItem.text()).toContain('Sort descending');
        expect(sortDescItem.prop('disabled')).toBe(false);
        const clearSortItem = wrapper.find('MenuItem').at(4);
        expect(clearSortItem.text()).toContain('Clear sort');
        expect(clearSortItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('isSortDesc', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            sorts: [new QuerySort({ fieldKey: 'column', dir: '-' })],
        });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 5);
        expect(wrapper.find('.fa-filter')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(2);
        const sortAscItem = wrapper.find('MenuItem').at(2);
        expect(sortAscItem.text()).toContain('Sort ascending');
        expect(sortAscItem.prop('disabled')).toBe(false);
        const sortDescItem = wrapper.find('MenuItem').at(3);
        expect(sortDescItem.text()).toContain('Sort descending');
        expect(sortDescItem.prop('disabled')).toBe(true);
        const clearSortItem = wrapper.find('MenuItem').at(4);
        expect(clearSortItem.text()).toContain('Clear sort');
        expect(clearSortItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('isSortDesc via view sort', () => {
        const sortObj = { fieldKey: 'column', dir: '-' };
        const view = ViewInfo.fromJson({ sort: [sortObj] });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap<string, ViewInfo>({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });

        const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo).mutate({
            sorts: [],
        });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 5);
        expect(wrapper.find('.fa-filter')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(2);
        const sortAscItem = wrapper.find('MenuItem').at(2);
        expect(sortAscItem.text()).toContain('Sort ascending');
        expect(sortAscItem.prop('disabled')).toBe(false);
        const sortDescItem = wrapper.find('MenuItem').at(3);
        expect(sortDescItem.text()).toContain('Sort descending');
        expect(sortDescItem.prop('disabled')).toBe(true);
        const clearSortItem = wrapper.find('MenuItem').at(4);
        expect(clearSortItem.text()).toContain('Clear sort');
        expect(clearSortItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('one colFilters', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            filterArray: [Filter.create('column', 'value', Filter.Types.EQUALS)],
        });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 5);
        expect(wrapper.find('.fa-filter')).toHaveLength(2);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(1);
        const removeFilterItem = wrapper.find('MenuItem').at(1);
        expect(removeFilterItem.text()).toBe('Remove filter');
        expect(removeFilterItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('view filter', () => {
        const filterObj = { fieldKey: 'column', value: 'val', op: 'contains' };
        const view = ViewInfo.fromJson({ filter: [filterObj] });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap<string, ViewInfo>({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });

        const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo).mutate({
            filterArray: [],
        });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 5);
        expect(wrapper.find('.fa-filter')).toHaveLength(2);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(1);
        const removeFilterItem = wrapper.find('MenuItem').at(1);
        expect(removeFilterItem.text()).toBe('Remove filter');
        expect(removeFilterItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('multiple colFilters, one being a view filter', () => {
        const filterObj = { fieldKey: 'column', value: 'val', op: 'contains' };
        const view = ViewInfo.fromJson({ filter: [filterObj] });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap<string, ViewInfo>({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });

        const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo).mutate({
            filterArray: [Filter.create('column', 'value', Filter.Types.EQUALS)],
        });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 5);
        expect(wrapper.find('.fa-filter')).toHaveLength(2);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(1);
        const removeFilterItem = wrapper.find('MenuItem').at(1);
        expect(removeFilterItem.text()).toBe('Remove filters');
        expect(removeFilterItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });
});

describe('EditableColumnTitle', () => {
    test('Not editing, with caption', () => {
        const column = new QueryColumn({
            caption: 'Test Column',
            name: 'Testing',
        });
        const wrapper = mount(<EditableColumnTitle column={column} onChange={jest.fn()} onCancel={jest.fn()} />);
        expect(wrapper.find('input').exists()).toBe(false);
        expect(wrapper.text()).toBe(column.caption);
        wrapper.unmount();
    });

    test('Not editing, no caption', () => {
        const wrapper = mount(
            <EditableColumnTitle
                column={new QueryColumn({ name: 'TestName' })}
                onChange={jest.fn()}
                onCancel={jest.fn()}
            />
        );
        expect(wrapper.find('input').exists()).toBe(false);
        expect(wrapper.text()).toBe('TestName');
        wrapper.unmount();
    });

    test('Not editing with nbsp', () => {
        const wrapper = mount(
            <EditableColumnTitle
                column={new QueryColumn({ name: 'TestName', caption: '&nbsp;' })}
                onChange={jest.fn()}
                onCancel={jest.fn()}
            />
        );
        expect(wrapper.find('input').exists()).toBe(false);
        expect(wrapper.text()).toBe('');
        wrapper.unmount();
    });

    test('Editing with nbsp', () => {
        const wrapper = mount(
            <EditableColumnTitle
                column={new QueryColumn({ name: 'TestName', caption: '&nbsp;' })}
                onChange={jest.fn()}
                onCancel={jest.fn()}
                editing
            />
        );
        expect(wrapper.find('input').exists()).toBe(false);
        expect(wrapper.text()).toBe('');
        wrapper.unmount();
    });

    test('Editing', async () => {
        const column = new QueryColumn({
            caption: 'Test Column',
            name: 'Testing',
        });
        const changeFn = jest.fn();
        const editToggleFn = jest.fn();
        const wrapper = mount(
            <EditableColumnTitle column={column} onChange={changeFn} onCancel={editToggleFn} editing />
        );
        const inputField = wrapper.find('input');
        expect(inputField.exists()).toBe(true);
        expect(inputField.prop('defaultValue')).toBe(column.caption);
        wrapper.unmount();
    });
});
