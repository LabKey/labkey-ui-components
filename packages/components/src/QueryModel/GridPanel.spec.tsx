import React, { PureComponent, ReactNode } from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Filter } from '@labkey/api';

import { GRID_CHECKBOX_OPTIONS, GridPanel, LoadingState, QueryInfo, QueryModel, QuerySort, SchemaQuery } from '..';

import { initUnitTests, makeQueryInfo, makeTestData } from '../testHelpers';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../test/data/mixtures-getQueryPaging.json';

import { ActionValue } from '../components/omnibox/actions/Action';
import { Change, ChangeType } from '../components/omnibox/OmniBox';

import { RequiresModelAndActions } from './withQueryModels';
import { RowsResponse } from './QueryModelLoader';
import { makeTestActions, makeTestModel } from './testUtils';

// The wrapper's return type for mount<GridPanel>(<GridPanel ... />)
type GridPanelWrapper = ReactWrapper<Readonly<GridPanel['props']>, Readonly<GridPanel['state']>, GridPanel>;

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO: QueryInfo;
let DATA: RowsResponse;

class TestButtons extends PureComponent<RequiresModelAndActions> {
    render(): ReactNode {
        return <div className="test-buttons-component">ButtonComponent for {this.props.model.id}</div>;
    }
}

beforeAll(() => {
    initUnitTests();
    QUERY_INFO = makeQueryInfo(mixturesQueryInfo);

    // Return so tests don't start till after the promise resolves, so we can guarantee DATA is initialized in tests.
    return makeTestData(mixturesQuery).then(data => {
        DATA = data;
    });
});

const CHART_MENU_SELECTOR = '.chart-menu';
const PAGINATION_SELECTOR = '.pagination-button-group';
const PAGINATION_INFO_SELECTOR = '.pagination-info';
const PAGE_SIZE_SELECTOR = '.page-size-menu';
const VIEW_MENU_SELECTOR = '.view-menu';
const GRID_SELECTOR = '.grid-panel__grid .table-responsive';
const GRID_INFO_SELECTOR = '.grid-panel__info';
const EXPORT_MENU_SELECTOR = '.export-menu';
const OMNIBOX_SELECTOR = '.grid-panel__omnibox OmniBox';
const DISABLED_BUTTON_CLASS = 'disabled-button-with-tooltip';
const CLEAR_ALL_SELECTOR = '.selection-status__clear-all';
const ERROR_SELECTOR = '.grid-panel__grid .alert-danger';

describe('GridPanel', () => {
    let actions;

    beforeEach(() => {
        actions = makeTestActions();
    });

    const expectChartMenu = (wrapper: GridPanelWrapper, disabledState: boolean): void => {
        expect(wrapper.find(CHART_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(CHART_MENU_SELECTOR).find('.dropdown').at(0).hasClass('disabled')).toEqual(disabledState);
    };

    const expectPanelClasses = (wrapper: GridPanelWrapper, classesExist): void => {
        expect(wrapper.find('.grid-panel').hasClass('panel')).toEqual(classesExist);
        expect(wrapper.find('.grid-panel').hasClass('panel-default')).toEqual(classesExist);
    };

    const expectPaginationVisible = (wrapper: GridPanelWrapper, visible: boolean): void => {
        expect(wrapper.find(PAGINATION_INFO_SELECTOR).exists()).toEqual(visible);
        expect(wrapper.find(PAGINATION_SELECTOR).exists()).toEqual(visible);
        expect(wrapper.find(PAGE_SIZE_SELECTOR).exists()).toEqual(visible);
    };

    const expectNoQueryInfo = (wrapper: GridPanelWrapper): void => {
        expectPaginationVisible(wrapper, false);
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(false);
        // OmniBox should be present, but disabled when we don't have a QueryInfo yet
        expect(wrapper.find(OMNIBOX_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(OMNIBOX_SELECTOR).props().disabled).toEqual(true);
        expectChartMenu(wrapper, true);
    };

    const expectNoRows = (wrapper: GridPanelWrapper): void => {
        const expectedButtons = wrapper.props().ButtonsComponent !== undefined;
        expectPaginationVisible(wrapper, false);
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(OMNIBOX_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(OMNIBOX_SELECTOR).props().disabled).toEqual(true);
        expect(wrapper.find(TestButtons).exists()).toEqual(expectedButtons);
        expectChartMenu(wrapper, true);
    };

    const expectGrid = (wrapper: GridPanelWrapper): void => {
        const { orderedRows } = wrapper.props().model;
        expect(wrapper.find(GRID_SELECTOR).exists());
        // +1 because of header row
        expect(wrapper.find(GRID_SELECTOR).find('tr').length).toEqual(orderedRows.length + 1);
    };

    const expectError = (wrapper: GridPanelWrapper, error: string): void => {
        expect(wrapper.find(ERROR_SELECTOR).text()).toEqual(error);
    };

    test('Render GridPanel', () => {
        const { rows, orderedRows, rowCount } = DATA;

        // Model is loading QueryInfo and Rows, should render loading, disabled ChartMenu, no pagination/ViewMenu.
        let model = makeTestModel(SCHEMA_QUERY);
        const wrapper = mount<GridPanel>(<GridPanel actions={actions} model={model} />);
        expectNoQueryInfo(wrapper);

        // Model is loading Rows, but not QueryInfo, should not render pagination, should render disabled ViewMenu.
        model = model.mutate({ queryInfoLoadingState: LoadingState.LOADED, queryInfo: QUERY_INFO });
        wrapper.setProps({ model });
        expectNoRows(wrapper);

        // Loaded rows and QueryInfo. Should render grid, pagination, ViewMenu, ChartMenu
        model = model.mutate({
            rows,
            orderedRows: orderedRows.slice(0, 20),
            rowCount,
            rowsLoadingState: LoadingState.LOADED,
            charts: [],
            chartsLoadingState: LoadingState.LOADED,
        });
        wrapper.setProps({ model });

        // Chart menu should be disabled if no charts are present and showSampleComparisonReports is false.
        expectChartMenu(wrapper, true);
        expect(wrapper.find(PAGINATION_INFO_SELECTOR).text()).toEqual('1 - 20 of 661');
        expect(wrapper.find(PAGINATION_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(OMNIBOX_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(OMNIBOX_SELECTOR).props().disabled).toEqual(false);

        wrapper.setProps({ showSampleComparisonReports: true });
        expectChartMenu(wrapper, false);

        // Previous, Page Menu, Next buttons should be present.
        let paginationButtons = wrapper.find(PAGINATION_SELECTOR).find('button');
        expect(paginationButtons.length).toEqual(3);

        // Previous button should be disabled.
        expect(paginationButtons.first().hasClass(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(paginationButtons.last().hasClass(DISABLED_BUTTON_CLASS)).toEqual(false);
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(GRID_SELECTOR).exists()).toEqual(true);

        // Header row + data rows.
        expect(wrapper.find(GRID_SELECTOR).find('tr').length).toEqual(21);

        // Has rows and QueryInfo, but new rows are loading, should render disabled pagination and loading spinner.
        model = model.mutate({ rowsLoadingState: LoadingState.LOADING });
        wrapper.setProps({ model });
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(true);
        expectPaginationVisible(wrapper, true);
        paginationButtons = wrapper.find(PAGINATION_SELECTOR).find('button');
        expect(paginationButtons.first().hasClass(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(paginationButtons.last().hasClass(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(wrapper.find(GRID_INFO_SELECTOR).text()).toContain('Loading data...');

        // Should render TestButtons component in the left part of the grid bar.
        wrapper.setProps({ ButtonsComponent: TestButtons });
        expect(wrapper.find(TestButtons).exists()).toEqual(true);

        // Panel classes should only be present when asPanel is true.
        expectPanelClasses(wrapper, true);
        wrapper.setProps({ asPanel: false });
        expectPanelClasses(wrapper, false);

        // pageSizes should be different
        expect(wrapper.find(PAGE_SIZE_SELECTOR).find('ul').text()).toEqual('Page Size2040100250400');
        wrapper.setProps({ pageSizes: [5, 10, 15, 20] });
        expect(wrapper.find(PAGE_SIZE_SELECTOR).find('ul').text()).toEqual('Page Size5101520');

        // Pagination should not be present.
        wrapper.setProps({ showPagination: false });
        expectPaginationVisible(wrapper, false);

        // ViewMenu should not be present.
        wrapper.setProps({ showViewMenu: false });
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(false);

        // export menu should not be rendered.
        wrapper.setProps({ showExport: false });
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(false);

        // chart menu should not be rendered.
        wrapper.setProps({ showChartMenu: false });
        expect(wrapper.find(CHART_MENU_SELECTOR).exists()).toEqual(false);

        // We should render nothing but an error if we had issues loading the QueryInfo.
        const queryInfoError = 'Error loading query info';
        model = model = makeTestModel(SCHEMA_QUERY).mutate({ queryInfoError });
        wrapper.setProps({
            model,
            asPanel: true,
            showPagination: true,
            showViewMenu: true,
            showExport: true,
            showChartMenu: true,
        });
        expectNoQueryInfo(wrapper);
        expectError(wrapper, queryInfoError);

        // We still render ChartMenu, ViewMenu, and any custom buttons
        const rowsError = 'Error loading rows';
        model = makeTestModel(SCHEMA_QUERY, QUERY_INFO).mutate({ rowsError });
        wrapper.setProps({ model });
        expectNoRows(wrapper);
        expectError(wrapper, rowsError);

        // If an error happens when loading selections we render a grid and an error.
        const selectionsError = 'Error loading selections';
        model = makeTestModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows, rowCount).mutate({ selectionsError });
        wrapper.setProps({ model });
        expectGrid(wrapper);
        expectError(wrapper, selectionsError);
    });

    const omniBoxTextMapper = (av): string => av.displayValue ?? av.value;

    const expectFilterState = (
        wrapper: GridPanelWrapper,
        actionValue: ActionValue,
        actionValues: ActionValue[],
        expectedFilters: Filter.IFilter[]
    ): void => {
        const grid = wrapper.instance();
        const { model } = grid.props;
        const { valueObject } = actionValue;
        const expectedOmniText = actionValues
            .filter(
                av => av.valueObject === valueObject || av.valueObject.getColumnName() !== valueObject.getColumnName()
            )
            .map(omniBoxTextMapper)
            .join('');
        expect(wrapper.find(OMNIBOX_SELECTOR).text()).toEqual(expectedOmniText);
        expect(actions.setFilters).toHaveBeenCalledWith(model.id, expectedFilters, grid.props.allowSelections);
        // Set the filterArray to expectedFilters to emulate actual behavior, so we can more easily test realistic
        // scenarios.
        wrapper.setProps({ model: model.mutate({ filterArray: expectedFilters }) });
    };

    const expectSortsState = (
        wrapper: GridPanelWrapper,
        actionValue: ActionValue,
        actionValues: ActionValue[],
        expectedSorts: QuerySort[]
    ): void => {
        const grid = wrapper.instance();
        const { model } = grid.props;
        const { valueObject } = actionValue;
        const expectedOmniText = actionValues
            .filter(av => av.valueObject === valueObject || av.valueObject.fieldKey !== valueObject.fieldKey)
            .map(omniBoxTextMapper)
            .join('');
        expect(wrapper.find(OMNIBOX_SELECTOR).text()).toEqual(expectedOmniText);
        expect(actions.setSorts).toHaveBeenCalledWith(model.id, expectedSorts);
        // Set the sorts to expectedSorts to emulate actual behavior, so we can more easily test realistic scenarios.
        wrapper.setProps({ model: model.mutate({ sorts: expectedSorts }) });
    };

    const testAddOmniBoxValue = (
        wrapper: GridPanelWrapper,
        actionValue: ActionValue,
        expectedState: Filter.IFilter[] | QuerySort[]
    ): void => {
        const grid = wrapper.instance();
        const values = grid.state.actionValues.concat(actionValue);
        grid.omniBoxChange(values, { type: ChangeType.add });
        if (actionValue.valueObject.fieldKey === undefined) {
            // assume filter
            expectFilterState(wrapper, actionValue, values, expectedState as Filter.IFilter[]);
        } else {
            expectSortsState(wrapper, actionValue, values, expectedState as QuerySort[]);
        }
    };

    const testModifyOmniBoxValue = (
        wrapper: GridPanelWrapper,
        actionValue: ActionValue,
        index: number,
        expectedState: Filter.IFilter[] | QuerySort[]
    ): void => {
        const grid = wrapper.instance();
        // OmniBox moves the modified action to the end of the actionValues array.
        const values = grid.state.actionValues.filter((v, i) => i !== index).concat(actionValue);
        grid.omniBoxChange(values, { type: ChangeType.modify, index });

        if (actionValue.valueObject.fieldKey === undefined) {
            // assume filter
            expectFilterState(wrapper, actionValue, values, expectedState as Filter.IFilter[]);
        } else {
            expectSortsState(wrapper, actionValue, values, expectedState as QuerySort[]);
        }
    };

    const testChangeSearch = (
        wrapper: GridPanelWrapper,
        actionValue: ActionValue,
        expectedFilters: Filter.IFilter[],
        index?: number
    ): void => {
        const grid = wrapper.instance();
        let values = grid.state.actionValues.concat(actionValue);
        let change: Change = { type: ChangeType.add };

        if (index !== undefined) {
            values = values.filter((av, i) => i !== index);
            change = { type: ChangeType.modify, index };
        }

        grid.omniBoxChange(values, change);
        const { model } = grid.props;
        const expectedOmniText = values.map(av => av.value).join('');
        expect(actions.setFilters).toHaveBeenCalledWith(model.id, expectedFilters, grid.props.allowSelections);
        expect(wrapper.find(OMNIBOX_SELECTOR).text()).toEqual(expectedOmniText);
        wrapper.setProps({ model: model.mutate({ filterArray: expectedFilters }) });
    };

    // Triggers a remove event at index and checks expectedFilters were passed to setFilters. Works for removing
    // filters and searches on OmniBox.
    const testRemoveFilter = (wrapper: GridPanelWrapper, expectedFilters: Filter.IFilter[], index: number): void => {
        const grid = wrapper.instance();
        const values = grid.state.actionValues.filter((av, i) => i !== index);
        grid.omniBoxChange(values, { type: ChangeType.remove, index });
        const { model } = grid.props;
        const expectedOmniText = values.map(av => av.value).join('');
        expect(actions.setFilters).toHaveBeenCalledWith(model.id, expectedFilters, grid.props.allowSelections);
        expect(wrapper.find(OMNIBOX_SELECTOR).text()).toEqual(expectedOmniText);
        wrapper.setProps({ model: model.mutate({ filterArray: expectedFilters }) });
    };

    const testSetView = (wrapper: GridPanelWrapper, viewName: string, viewLabel: string): void => {
        const grid = wrapper.instance();
        // Omnibox filters out existing view actions for us because they are singletons.
        let values = grid.state.actionValues.filter(v => v.action.keyword !== 'view');
        // GridPanel converts viewName to label
        const expectedOmniText = values.map(v => v.displayValue ?? v.value).join('') + viewLabel;
        values = values.concat([
            {
                action: grid.omniBoxActions.view,
                value: viewName,
            },
        ]);
        grid.omniBoxChange(values, { type: ChangeType.add });
        expect(wrapper.find(OMNIBOX_SELECTOR).text()).toEqual(expectedOmniText);
        expect(actions.setView).toHaveBeenCalledWith('model', viewName, grid.props.allowSelections);
    };

    test('OmniBox', () => {
        const { rows, orderedRows, rowCount } = DATA;
        const model = makeTestModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows.slice(0, 20), rowCount);
        const wrapper = mount<GridPanel>(<GridPanel actions={actions} model={model} />);
        const grid = wrapper.instance();

        const filter1 = Filter.create('Name', 'DMXP', Filter.Types.EQUAL);
        const filterAction1 = {
            action: grid.omniBoxActions.filter,
            value: '"Name" = DMXP',
            valueObject: filter1,
        };
        const filter2 = Filter.create('expirationTime', '1', Filter.Types.EQUAL);
        const filterAction2 = {
            action: grid.omniBoxActions.filter,
            value: '"Expiration Time" = 1',
            valueObject: filter2,
        };
        const filter3 = Filter.create('expirationTime', '2', Filter.Types.EQUAL);
        const filterAction3 = {
            action: grid.omniBoxActions.filter,
            value: '"Expiration Time" = 2',
            valueObject: filter3,
        };
        const filter4 = Filter.create('expirationTime', '10', Filter.Types.EQUAL);
        const filterAction4 = {
            action: grid.omniBoxActions.filter,
            value: '"Expiration Time" = 10',
            valueObject: filter4,
        };
        const filter5 = Filter.create('Name', 'PBS', Filter.Types.EQUAL);
        const filterAction5 = {
            action: grid.omniBoxActions.filter,
            value: '"Name" = PBS',
            valueObject: filter5,
        };
        const search1 = Filter.create('*', 'foo', Filter.Types.Q);
        const searchAction1 = {
            action: grid.omniBoxActions.search,
            value: 'foo',
            valueObject: search1,
        };
        const search2 = Filter.create('*', 'bar', Filter.Types.Q);
        const searchAction2 = {
            action: grid.omniBoxActions.search,
            value: 'bar',
            valueObject: Filter.create('*', 'bar', Filter.Types.Q),
        };
        const search3 = Filter.create('*', 'foo2', Filter.Types.Q);
        const searchAction3 = {
            action: grid.omniBoxActions.search,
            value: 'foo2',
            valueObject: search3,
        };
        const sort1 = new QuerySort({ fieldKey: 'Name' });
        const sortAction1 = {
            action: grid.omniBoxActions.sort,
            displayValue: 'Name',
            value: 'Name ASC',
            valueObject: sort1,
        };
        const sort2 = new QuerySort({ fieldKey: 'expirationTime' });
        const sortAction2 = {
            action: grid.omniBoxActions.sort,
            displayValue: 'Expiration Time',
            value: 'expirationTime ASC',
            valueObject: sort2,
        };
        const sort3 = new QuerySort({ fieldKey: 'Name', dir: '-' });
        const sortAction3 = {
            action: grid.omniBoxActions.sort,
            displayValue: 'Name',
            value: 'Name DESC',
            valueObject: sort3,
        };

        // You should be able to add multiple filters if they're on different columns.
        testAddOmniBoxValue(wrapper, filterAction1, [filter1]);
        testAddOmniBoxValue(wrapper, filterAction2, [filter1, filter2]);
        // Adding another filter on the same column as the second should replace the second filter.
        testAddOmniBoxValue(wrapper, filterAction3, [filter1, filter3]);
        // Modifying the second filter should replace the filter on the model, and not touch the first filter.
        testModifyOmniBoxValue(wrapper, filterAction4, 1, [filter1, filter4]);
        // Modifying the second filter to have the same column as the first should replace the first and second filter.
        testModifyOmniBoxValue(wrapper, filterAction5, 1, [filter5]);

        // We should allow multiple searches (which are filters), and they should not conflict with other filters.
        testChangeSearch(wrapper, searchAction1, [filter5, search1]);
        testChangeSearch(wrapper, searchAction2, [filter5, search1, search2]);
        // Modifying a search should remove it from the filters
        testChangeSearch(wrapper, searchAction3, [filter5, search2, search3], 1);

        // Removing filters in the OmniBox should result in setFilters being called without those filters.
        testRemoveFilter(wrapper, [search2, search3], 0);
        testRemoveFilter(wrapper, [search2], 1);

        // Change allowSelections to false, this should cause setFilters to be called with loadSelections set to false.
        wrapper.setProps({ allowSelections: false });
        testAddOmniBoxValue(wrapper, filterAction1, [search2, filter1]);

        // You should be able to add multiple sorts if they are on different columns.
        testAddOmniBoxValue(wrapper, sortAction1, [sort1]);
        testAddOmniBoxValue(wrapper, sortAction2, [sort1, sort2]);
        // Test modifying existing sort.
        // OmniBox Action values are [search2, filter1, sort1, sort2], so index of sort1 is 2
        testModifyOmniBoxValue(wrapper, sortAction3, 2, [sort2, sort3]);
        // Modifying an existing sort and changing the column should replace any pre-existing sorts with the same
        // column and remove the modified sort.
        testModifyOmniBoxValue(wrapper, sortAction1, 2, [sort1]);

        // Setting a view for the first time adds it to the OmniBox values
        testSetView(wrapper, 'noMixtures', 'No Mixtures or Extra');
        // Setting it a second time modifies the existing value
        testSetView(wrapper, 'noExtraColumn', 'No Extra Column');

        // Emulate remove view
        const values = grid.state.actionValues.filter(v => v.action.keyword !== 'view');
        grid.omniBoxChange(values, { type: ChangeType.remove, index: grid.state.actionValues.length - 1 });
        expect(wrapper.find(OMNIBOX_SELECTOR).text()).toEqual(values.map(omniBoxTextMapper).join(''));
        expect(actions.setView).toHaveBeenCalledWith('model', undefined, false);
    });

    const expectBoundState = (
        wrapper: GridPanelWrapper,
        attrs: Partial<QueryModel>,
        expectedLen: number,
        expectedValues: any[]
    ): void => {
        const model = wrapper.props().model;
        wrapper.setProps({ model: model.mutate(attrs) });
        expect(wrapper.state().actionValues.length).toEqual(expectedLen);

        expectedValues.forEach((value): void => {
            const findByValue = (av: ActionValue): boolean => av.valueObject === value || av.value === value;
            expect(wrapper.state().actionValues.find(findByValue)).not.toEqual(undefined);
        });
    };

    test('Omnibox Model Binding', () => {
        // This test ensures that the Omnibox updates when there are exernal changes to the model, typically this
        // happens when bindURL is true and there is a URL change.
        const { rows, orderedRows, rowCount } = DATA;
        const model = makeTestModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows.slice(0, 20), rowCount);
        const wrapper = mount<GridPanel>(<GridPanel actions={actions} model={model} />);
        const nameSort = new QuerySort({ fieldKey: 'Name' });
        const nameFilter = Filter.create('Name', 'DMXP', Filter.Types.EQUAL);
        const expirFilter = Filter.create('expirationTime', '1', Filter.Types.EQUAL);
        const viewName = 'noMixtures';
        const viewLabel = 'No Mixtures or Extra';
        const noMixtursSQ = SchemaQuery.create(SCHEMA_QUERY.schemaName, SCHEMA_QUERY.queryName, viewName);
        const search = Filter.create('*', 'foobar', Filter.Types.Q);

        expectBoundState(wrapper, {}, 0, []);
        expectBoundState(wrapper, { sorts: [nameSort] }, 1, [nameSort]);
        expectBoundState(wrapper, { filterArray: [nameFilter] }, 2, [nameSort, nameFilter]);
        expectBoundState(wrapper, { filterArray: [expirFilter] }, 2, [nameSort, expirFilter]);
        expectBoundState(wrapper, { schemaQuery: noMixtursSQ }, 3, [nameSort, expirFilter, viewLabel]);
        expectBoundState(wrapper, { filterArray: [expirFilter, search] }, 4, [
            nameSort,
            expirFilter,
            viewLabel,
            search,
        ]);
        expectBoundState(wrapper, { sorts: [], filterArray: [], schemaQuery: SCHEMA_QUERY }, 0, []);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getCheckbox = (wrapper: GridPanelWrapper, index: number): ReactWrapper<any> => {
        return wrapper.find(GRID_SELECTOR).find('tr').at(index).find('input[type="checkbox"]');
    };

    const testSelectRow = (wrapper: GridPanelWrapper, index: number, expectedState: boolean): void => {
        const grid = wrapper.instance();
        const { model } = grid.props;
        const row = model.gridData[index];
        const rowId = model.orderedRows[index];

        // The first tr is the header, so we increment the index by 1
        let checkbox = getCheckbox(wrapper, index + 1);
        const event = { target: { checked: expectedState } };
        checkbox.simulate('change', event);
        expect(actions.selectRow).toHaveBeenCalledWith(model.id, expectedState, row);
        const newSelections = new Set(model.selections);

        if (expectedState) {
            newSelections.add(rowId);
        } else {
            newSelections.delete(rowId);
        }

        // Set the selections so we can also test UI rendering.
        wrapper.setProps({ model: model.mutate({ selections: newSelections }) });
        checkbox = getCheckbox(wrapper, index + 1);
        expect(checkbox.props().checked).toEqual(expectedState);
    };

    /**
     * @param wrapper enzyme wrapped GridPanel.
     * @param checkedState the value you want the checkbox to emit (true/false)
     * @param expectedState the value you expect to be passed to selectPage, due to how indeterminate state works true
     * checkedState may still result in false expectedState (see GridPanel.selectPage for details)
     */
    const testSelectPage = (wrapper: GridPanelWrapper, checkedState: boolean, expectedState: boolean): void => {
        const grid = wrapper.instance();
        const { model } = grid.props;
        let checkbox = getCheckbox(wrapper, 0);
        checkbox.simulate('change', { target: { checked: checkedState } });
        expect(actions.selectPage).toHaveBeenCalledWith(model.id, expectedState);
        const newSelections = expectedState ? new Set<string>(model.orderedRows) : new Set<string>();
        // Set the selections so we can also test UI rendering.
        wrapper.setProps({ model: model.mutate({ selections: newSelections }) });
        checkbox = getCheckbox(wrapper, 0);
        expect(checkbox.props().checked).toEqual(expectedState);
        const expectedSelectedState = expectedState ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.NONE;
        // Indeterminate status is not supported by React or Enzyme so we have to check the model selectedState
        expect(grid.props.model.selectedState).toEqual(expectedSelectedState);
    };

    const expectHeaderSelectionStatus = (wrapper: GridPanelWrapper, expectedState: boolean): void => {
        const checkbox = getCheckbox(wrapper, 0);
        expect(checkbox.props().checked).toEqual(expectedState);
    };

    const expectSelectionStatusCount = (wrapper: GridPanelWrapper, count: number): void => {
        const selectionStatus = wrapper.find('.selection-status__count');
        if (count === 0) {
            expect(selectionStatus.exists()).toEqual(false);
        } else {
            const grid = wrapper.instance();
            const total = grid.props.model.rowCount;
            expect(selectionStatus.text()).toEqual(`${count} of ${total} selected`);
        }
    };

    const expectClearButtonState = (wrapper: GridPanelWrapper, text?: string): void => {
        const clearButton = wrapper.find(CLEAR_ALL_SELECTOR);

        if (text === undefined) {
            expect(clearButton.exists()).toEqual(false);
        } else {
            expect(clearButton.text()).toEqual(text);
        }
    };

    const testSelectAll = (wrapper: GridPanelWrapper): void => {
        const grid = wrapper.instance();
        const { model } = grid.props;
        wrapper.find('.selection-status__select-all button').simulate('click');
        expect(actions.selectAllRows).toHaveBeenCalledWith(model.id);
        // Set selections to all to simulate actual behavior. This works because our model.rows object actually has
        // all 661 rows in it, which is not normal in production use.
        wrapper.setProps({ model: model.mutate({ selections: new Set(Object.keys(model.rows)) }) });
        expectClearButtonState(wrapper, 'Clear all');
    };

    const testClearAll = (wrapper: GridPanelWrapper): void => {
        const grid = wrapper.instance();
        const { model } = grid.props;
        wrapper.find(CLEAR_ALL_SELECTOR + ' button').simulate('click');
        expect(actions.clearSelections).toHaveBeenCalledWith(model.id);
        wrapper.setProps({ model: model.mutate({ selections: new Set() }) });
        expectClearButtonState(wrapper);
    };

    test('Selections', () => {
        const { rows, orderedRows, rowCount } = DATA;
        const model = makeTestModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows.slice(0, 20), rowCount).mutate({
            selections: new Set(),
            selectionsLoadingState: LoadingState.LOADED,
        });
        const wrapper = mount<GridPanel>(<GridPanel actions={actions} model={model} />);

        // Check that with no selections the header checkbox is not selected.
        expectHeaderSelectionStatus(wrapper, false);
        // Check that the clear button is not present
        expectClearButtonState(wrapper);
        expectSelectionStatusCount(wrapper, 0);

        // Select first row.
        testSelectRow(wrapper, 0, true);
        expectSelectionStatusCount(wrapper, 1);
        expectClearButtonState(wrapper, 'Clear');
        testSelectRow(wrapper, 1, true);
        expectSelectionStatusCount(wrapper, 2);
        expectClearButtonState(wrapper, 'Clear both');
        // Enzyme doesn't support refs, and React doesn't natively support indeterminate status on checkboxes, so we
        // should expect the checkbox to not be checked, and we check the model for selectedState.
        expectHeaderSelectionStatus(wrapper, false);
        expect(wrapper.props().model.selectedState).toEqual(GRID_CHECKBOX_OPTIONS.SOME);

        // Since some rows are checked, checking the header checkbox again should result in de-selecting the rows.
        testSelectPage(wrapper, true, false);
        expectSelectionStatusCount(wrapper, 0);
        expectClearButtonState(wrapper);

        // Since no rows are checked, checking the header should select all rows on the page.
        testSelectPage(wrapper, true, true);
        expectSelectionStatusCount(wrapper, 20);
        expectClearButtonState(wrapper, 'Clear all');

        // Select all rows
        testSelectAll(wrapper);
        testClearAll(wrapper);
    });
});
