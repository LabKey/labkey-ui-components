/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import userEvent from '@testing-library/user-event';
import { Filter } from '@labkey/api';

import { makeQueryInfo, makeTestData } from '../../internal/test/testHelpers';
import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../../test/data/mixtures-getQueryPaging.json';

import { TEST_USER_EDITOR, TEST_USER_PROJECT_ADMIN, TEST_USER_READER } from '../../internal/userFixtures';
import { ExtendedMap } from '../ExtendedMap';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { LoadingState } from '../LoadingState';

import { ViewInfo } from '../../internal/ViewInfo';
import { QuerySort } from '../QuerySort';
import { GRID_CHECKBOX_OPTIONS } from '../../internal/constants';

import { QueryModel } from './QueryModel';
import { GridPanel, GridTitle } from './GridPanel';
import { makeTestActions, makeTestQueryModel } from './testUtils';
import { RequiresModelAndActions } from './withQueryModels';
import { RowsResponse } from './QueryModelLoader';
import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';

const SCHEMA_QUERY = new SchemaQuery('exp.data', 'mixtures');
let QUERY_INFO: QueryInfo;
let DATA: RowsResponse;

class TestButtons extends PureComponent<RequiresModelAndActions> {
    render(): ReactNode {
        return <div className="test-buttons-component">ButtonComponent for {this.props.model.id}</div>;
    }
}

beforeAll(() => {
    QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
    DATA = makeTestData(mixturesQuery);
    LABKEY.user = TEST_USER_READER;
});

const CHART_MENU_SELECTOR = '.chart-menu';
const PAGINATION_SELECTOR = '.pagination-button-group';
const PAGINATION_INFO_SELECTOR = '.pagination-info';
const VIEW_MENU_SELECTOR = '.view-menu';
const GRID_SELECTOR = '.grid-panel__grid .table-responsive';
const GRID_INFO_SELECTOR = '.grid-panel__info';
const EXPORT_MENU_SELECTOR = '.export-menu';
const FILTER_STATUS_SELECTOR = '.grid-panel__filter-status';
const FILTER_STATUS_VALUE = '.filter-status-value';
const DISABLED_BUTTON_CLASS = 'disabled-button-with-tooltip';
const CLEAR_ALL_SELECTOR = '.selection-status__clear-all';
const ERROR_SELECTOR = '.grid-panel__grid .alert-danger';

describe('GridPanel', () => {
    let actions;

    beforeEach(() => {
        actions = makeTestActions(jest.fn);
    });

    const expectChartMenu = (disabledState: boolean): void => {
        expectChartMenuVisible(true);
        const toggle = document.querySelector<HTMLButtonElement>(CHART_MENU_SELECTOR + ' .dropdown-toggle');
        expect(toggle).toBeInTheDocument();
        expect(toggle.disabled).toEqual(disabledState);
    };

    const expectChartMenuVisible = (visible: boolean): void => {
        const menu = document.querySelector(CHART_MENU_SELECTOR);
        if (visible) {
            expect(menu).toBeInTheDocument();
        } else {
            expect(menu).not.toBeInTheDocument();
        }
    };

    const expectPanelClasses = (classesExist: boolean): void => {
        const panel = document.querySelector('.grid-panel');
        expect(panel.classList.contains('panel')).toEqual(classesExist);
        expect(panel.classList.contains('panel-default')).toEqual(classesExist);
    };

    const expectGridTitle = (visible?: boolean, title?: string): void => {
        const gridTitle = document.querySelector('.view-header');
        expect(gridTitle !== null).toEqual(visible);
        if (title && visible) {
            expect(gridTitle).toHaveTextContent(title);
        }
    };

    const expectPaginationVisible = (visible: boolean): void => {
        const info = document.querySelector(PAGINATION_INFO_SELECTOR);
        const pager = document.querySelector(PAGINATION_SELECTOR);
        if (visible) {
            expect(info).toBeInTheDocument();
            expect(pager).toBeInTheDocument();
        } else {
            expect(info).not.toBeInTheDocument();
            expect(pager).not.toBeInTheDocument();
        }
    };

    const expectNoQueryInfo = (): void => {
        expectPaginationVisible(false);
        expect(document.querySelector(EXPORT_MENU_SELECTOR)).not.toBeInTheDocument();
        expect(document.querySelector(VIEW_MENU_SELECTOR)).not.toBeInTheDocument();
        expect(document.querySelector(FILTER_STATUS_SELECTOR)).toBeInTheDocument();
    };

    const expectNoRows = (hasButtonsComponent: boolean): void => {
        expectPaginationVisible(false);
        expect(document.querySelector(EXPORT_MENU_SELECTOR)).not.toBeInTheDocument();
        expect(document.querySelector(VIEW_MENU_SELECTOR)).toBeInTheDocument();
        expect(document.querySelector(FILTER_STATUS_SELECTOR)).toBeInTheDocument();
        expect(document.querySelector('.test-buttons-component') !== null).toEqual(hasButtonsComponent);
    };

    const expectGrid = (model: QueryModel): void => {
        const { orderedRows } = model;
        const grid = document.querySelector(GRID_SELECTOR);
        expect(grid).toBeInTheDocument();
        // +1 because of header row
        expect(grid.querySelectorAll('tr').length).toEqual(orderedRows.length + 1);
    };

    const expectError = (error: string): void => {
        const errorEl = document.querySelector(ERROR_SELECTOR);
        expect(errorEl).toBeInTheDocument();
        expect(errorEl).toHaveTextContent(error);
    };

    test('Render GridPanel', () => {
        const { rows, orderedRows, rowCount } = DATA;

        // Model is loading QueryInfo and Rows, should render loading, no ChartMenu/Pagination/ViewMenu.
        let model = makeTestQueryModel(SCHEMA_QUERY);
        const { rerender } = renderWithAppContext(<GridPanel actions={actions} model={model} />);
        expectNoQueryInfo();

        // Model is loading Rows, but not QueryInfo, should not render pagination, should render disabled ViewMenu.
        model = model.mutate({ queryInfoLoadingState: LoadingState.LOADED, queryInfo: QUERY_INFO });
        rerender(<GridPanel actions={actions} model={model} />);
        expectNoRows(false);
        expectChartMenuVisible(true);
        expectGridTitle(false);

        rerender(<GridPanel actions={actions} model={model} title="Test title" />);
        expectGridTitle(true, 'Test title');

        rerender(<GridPanel actions={actions} hasHeader model={model} title="Test title" />);
        expectGridTitle(true); // Title is now rendered inside GridTitle component, not as prop

        // Loaded rows and QueryInfo. Should render grid, pagination, ViewMenu, ChartMenu
        model = model.mutate({
            rows,
            orderedRows: orderedRows.slice(0, 20),
            rowCount,
            rowsLoadingState: LoadingState.LOADED,
            totalCountLoadingState: LoadingState.LOADED,
            charts: [],
            chartsLoadingState: LoadingState.LOADED,
        });
        rerender(<GridPanel actions={actions} model={model} />);

        // Chart menu should be disabled if no charts are present
        expectChartMenuVisible(false);
        expect(document.querySelector(PAGINATION_INFO_SELECTOR)).toHaveTextContent('1 - 20 of 661');
        expect(document.querySelector(PAGINATION_SELECTOR)).toBeInTheDocument();
        expect(document.querySelector(EXPORT_MENU_SELECTOR)).toBeInTheDocument();
        expect(document.querySelector(FILTER_STATUS_SELECTOR)).toBeInTheDocument();

        // Previous, Page Menu, Next buttons should be present.
        let paginationButtons = document.querySelectorAll(PAGINATION_SELECTOR + ' button');
        // There are 6 pagination buttons because we have two components rendering pagination due to media queries that
        // hide/show the duplicate set based on screen size.
        expect(paginationButtons.length).toEqual(6);

        // Previous button should be disabled.
        expect(paginationButtons[0].classList.contains(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(paginationButtons[paginationButtons.length - 1].classList.contains(DISABLED_BUTTON_CLASS)).toEqual(
            false
        );
        expect(document.querySelector(VIEW_MENU_SELECTOR)).toBeInTheDocument();
        expect(document.querySelector(GRID_SELECTOR)).toBeInTheDocument();

        // Header row + data rows.
        expect(document.querySelectorAll(GRID_SELECTOR + ' tr').length).toEqual(21);

        // Has rows and QueryInfo, but new rows are loading, should render disabled pagination and loading spinner.
        model = model.mutate({ rowsLoadingState: LoadingState.LOADING });
        rerender(<GridPanel actions={actions} model={model} />);
        expect(document.querySelector(EXPORT_MENU_SELECTOR)).toBeInTheDocument();
        expect(document.querySelector(VIEW_MENU_SELECTOR)).toBeInTheDocument();
        expectPaginationVisible(true);
        paginationButtons = document.querySelectorAll(PAGINATION_SELECTOR + ' button');
        expect(paginationButtons[0].classList.contains(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(paginationButtons[paginationButtons.length - 1].classList.contains(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(document.querySelector(GRID_INFO_SELECTOR).textContent).toContain('Loading data...');

        // Should render TestButtons component in the left part of the grid bar.
        rerender(<GridPanel actions={actions} ButtonsComponent={TestButtons} model={model} />);
        expect(document.querySelector('.test-buttons-component')).toBeInTheDocument();

        // Panel classes should only be present when asPanel is true.
        expectPanelClasses(true);
        rerender(<GridPanel actions={actions} asPanel={false} ButtonsComponent={TestButtons} model={model} />);
        expectPanelClasses(false);

        // pageSizes should be different
        rerender(<GridPanel actions={actions} model={model} />);
        expect(document.querySelector(PAGINATION_SELECTOR + ' ul')).toHaveTextContent(
            'Jump ToFirst PageLast Page...Page Size2040100250400'
        );
        rerender(<GridPanel actions={actions} model={model} pageSizes={[5, 10, 15, 20]} />);
        expect(document.querySelector(PAGINATION_SELECTOR + ' ul')).toHaveTextContent(
            'Jump ToFirst PageLast Page...Page Size5101520'
        );

        // Pagination should not be present.
        rerender(<GridPanel actions={actions} model={model} pageSizes={[5, 10, 15, 20]} showPagination={false} />);
        expectPaginationVisible(false);

        // ViewMenu should not be present.
        rerender(
            <GridPanel
                actions={actions}
                model={model}
                pageSizes={[5, 10, 15, 20]}
                showPagination={false}
                showViewMenu={false}
            />
        );
        expect(document.querySelector(VIEW_MENU_SELECTOR)).not.toBeInTheDocument();

        // export menu should not be rendered.
        rerender(
            <GridPanel
                actions={actions}
                model={model}
                pageSizes={[5, 10, 15, 20]}
                showExport={false}
                showPagination={false}
                showViewMenu={false}
            />
        );
        expect(document.querySelector(EXPORT_MENU_SELECTOR)).not.toBeInTheDocument();

        // chart menu should not be rendered.
        rerender(
            <GridPanel
                actions={actions}
                model={model}
                pageSizes={[5, 10, 15, 20]}
                showChartMenu={false}
                showExport={false}
                showPagination={false}
                showViewMenu={false}
            />
        );
        expectChartMenuVisible(false);

        // We should render nothing but an error if we had issues loading the QueryInfo.
        const queryInfoError = 'Error loading query info';
        model = makeTestQueryModel(SCHEMA_QUERY).mutate({ queryInfoError });
        rerender(
            <GridPanel actions={actions} asPanel model={model} showChartMenu showExport showPagination showViewMenu />
        );
        expectNoQueryInfo();
        expectChartMenu(true);
        expectError(queryInfoError);

        // We still render ChartMenu, ViewMenu, and any custom buttons
        const rowsError = 'Error loading rows';
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO).mutate({ rowsError });
        rerender(
            <GridPanel
                actions={actions}
                asPanel
                ButtonsComponent={TestButtons}
                model={model}
                showChartMenu
                showExport
                showPagination
                showViewMenu
            />
        );
        expectNoRows(true);
        expectChartMenu(true);
        expectError(rowsError);

        // If an error happens when loading selections we render a grid and an error.
        const selectionsError = 'Error loading selections';
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows, rowCount).mutate({ selectionsError });
        rerender(<GridPanel actions={actions} model={model} />);
        expectGrid(model);
        expectError(selectionsError);
    });

    test('FilterStatus Model Binding', () => {
        // This test ensures that the filter status updates when there are external changes to the model, typically this
        // happens when bindURL is true and there is a URL change.
        const { rows, orderedRows, rowCount } = DATA;
        let model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows.slice(0, 20), rowCount);
        const { rerender } = renderWithAppContext(<GridPanel actions={actions} model={model} />);

        const nameSort = new QuerySort({ fieldKey: 'Name' });
        const nameFilter = Filter.create('Name', 'DMXP', Filter.Types.EQUAL);
        const expirFilter = Filter.create('expirationTime', '1', Filter.Types.EQUAL);
        const viewName = 'noMixtures';
        const noMixturesSQ = new SchemaQuery(SCHEMA_QUERY.schemaName, SCHEMA_QUERY.queryName, viewName);
        const search = Filter.create('*', 'foobar', Filter.Types.Q);

        let filterStatus = document.querySelector(FILTER_STATUS_SELECTOR);
        expect(filterStatus.textContent).toEqual('');

        // Add sort
        model = model.mutate({ sorts: [nameSort] });
        rerender(<GridPanel actions={actions} model={model} />);
        filterStatus = document.querySelector(FILTER_STATUS_SELECTOR);
        expect(filterStatus).toBeInTheDocument();
        expect(document.querySelectorAll(FILTER_STATUS_VALUE)).toHaveLength(0); // We don't render sorts

        // Add filter
        model = model.mutate({ filterArray: [nameFilter] });
        rerender(<GridPanel actions={actions} model={model} />);
        filterStatus = document.querySelector(FILTER_STATUS_SELECTOR);
        expect(filterStatus.textContent).toContain('Name = DMXP');

        // Change filter
        model = model.mutate({ filterArray: [expirFilter] });
        rerender(<GridPanel actions={actions} model={model} />);
        filterStatus = document.querySelector(FILTER_STATUS_SELECTOR);
        expect(filterStatus.textContent).not.toContain('Name = DMXP');
        expect(filterStatus.textContent).toContain('Expiration Time = 1');

        // Change view
        model = model.mutate({ schemaQuery: noMixturesSQ });
        rerender(<GridPanel actions={actions} model={model} />);
        filterStatus = document.querySelector(FILTER_STATUS_SELECTOR);
        expect(filterStatus.textContent).toContain('Expiration Time = 1');
        // View change itself doesn't clear filters unless model logic dictates it

        // Add search
        model = model.mutate({ filterArray: [expirFilter, search] });
        rerender(<GridPanel actions={actions} model={model} />);
        filterStatus = document.querySelector(FILTER_STATUS_SELECTOR);
        expect(filterStatus.textContent).toContain('Expiration Time = 1');
        expect(filterStatus.textContent).not.toContain('foobar');

        // Clear all
        model = model.mutate({ sorts: [], filterArray: [], schemaQuery: SCHEMA_QUERY });
        rerender(<GridPanel actions={actions} model={model} />);
        filterStatus = document.querySelector(FILTER_STATUS_SELECTOR);
        expect(filterStatus.textContent).toEqual('');
    });

    test('FilterStatus from saved view', () => {
        // This test ensures that the filter status includes sorts/filters from the saved view
        const nameSort = { fieldKey: 'Name', dir: '+' };
        const nameFilter = { fieldKey: 'Name', value: 'DMXP', op: 'eq' };
        const expirFilter = { fieldKey: 'expirationTime', value: '1', op: 'eq' };
        const view = ViewInfo.fromJson({
            name: ViewInfo.DEFAULT_NAME.toLowerCase(),
            filter: [nameFilter, expirFilter],
            sort: [nameSort],
        });
        const queryInfo = new QueryInfo({
            columns: QUERY_INFO.columns,
            views: new ExtendedMap({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });
        let model = makeTestQueryModel(SCHEMA_QUERY, queryInfo, {}, [], 0);
        const { rerender } = renderWithAppContext(<GridPanel actions={actions} model={model} />);

        const expirSort = new QuerySort({ fieldKey: 'expirationTime', dir: '-' });
        const expirFilter2 = Filter.create('expirationTime', '2');

        model = model.mutate({ sorts: [expirSort], filterArray: [expirFilter2] });
        rerender(<GridPanel actions={actions} model={model} />);

        const filterTags = document.querySelectorAll(FILTER_STATUS_VALUE);
        expect(filterTags.length).toBe(3);
        expect(filterTags[0]).toHaveTextContent('Expiration Time = 1');
        expect(filterTags[0].classList).toContain('is-readonly');
        expect(filterTags[1]).toHaveTextContent('Expiration Time = 2');
        expect(filterTags[1].classList).not.toContain('is-readonly');
        expect(filterTags[2]).toHaveTextContent('Name = DMXP');
        expect(filterTags[2].classList).toContain('is-readonly');
    });

    test('SaveViewModal lists the filters and sorts that will be saved', async () => {
        const view = ViewInfo.fromJson({
            name: ViewInfo.DEFAULT_NAME.toLowerCase(),
            filter: [{ fieldKey: 'Name', value: 'DMXP', op: 'eq' }],
            sort: [{ fieldKey: 'Name', dir: '+' }],
            savable: true,
            session: true,
        });
        const queryInfo = new QueryInfo({
            columns: QUERY_INFO.columns,
            views: new ExtendedMap({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });
        const model = makeTestQueryModel(SCHEMA_QUERY, queryInfo, {}, [], 0).mutate({
            filterArray: [Filter.create('expirationTime', '2')],
            sorts: [new QuerySort({ fieldKey: 'expirationTime', dir: '-' })],
        });
        renderWithAppContext(<GridPanel actions={actions} model={model} />, {
            serverContext: { user: TEST_USER_EDITOR },
        });

        await userEvent.click(document.querySelector('.view-header .btn-success'));

        const sections = document.querySelectorAll('.save-view-modal__action-values');
        expect(sections).toHaveLength(2);

        // the view's saved filters and the user's ad hoc ones, both without the grid bar's read-only treatment
        const filterTags = sections[0].querySelectorAll(FILTER_STATUS_VALUE);
        expect(filterTags).toHaveLength(2);
        expect(filterTags[0]).toHaveTextContent('Name = DMXP');
        expect(filterTags[1]).toHaveTextContent('Expiration Time = 2');
        expect(document.querySelectorAll('.save-view-modal .is-readonly')).toHaveLength(0);

        const sortTags = sections[1].querySelectorAll(FILTER_STATUS_VALUE);
        expect(sortTags).toHaveLength(2);
        expect(sortTags[0]).toHaveTextContent('Expiration Time');
        expect(sortTags[0].querySelectorAll('.fa-sort-amount-desc')).toHaveLength(1);
        expect(sortTags[0].parentElement.getAttribute('title')).toBe('Sorted descending');
        expect(sortTags[1]).toHaveTextContent('Name');
        expect(sortTags[1].querySelectorAll('.fa-sort-amount-asc')).toHaveLength(1);
        expect(sortTags[1].parentElement.getAttribute('title')).toBe('Sorted ascending');
    });

    // GitHub Issue #696: onSaveView persists filters and sorts whether or not the grid can resolve a column for them,
    // so the dialog has to list them even though the filter status bar leaves them out.
    test('SaveViewModal lists filters and sorts whose column no longer resolves', async () => {
        const view = ViewInfo.fromJson({
            name: ViewInfo.DEFAULT_NAME.toLowerCase(),
            filter: [{ fieldKey: 'DeletedField', value: 'x', op: 'eq' }],
            sort: [{ fieldKey: 'DeletedField', dir: '+' }],
            savable: true,
            session: true,
        });
        const queryInfo = new QueryInfo({
            columns: QUERY_INFO.columns,
            views: new ExtendedMap({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });
        const model = makeTestQueryModel(SCHEMA_QUERY, queryInfo, {}, [], 0);
        renderWithAppContext(<GridPanel actions={actions} model={model} />, {
            serverContext: { user: TEST_USER_EDITOR },
        });

        expect(document.querySelectorAll(`${FILTER_STATUS_SELECTOR} ${FILTER_STATUS_VALUE}`)).toHaveLength(0);

        await userEvent.click(document.querySelector('.view-header .btn-success'));

        const sections = document.querySelectorAll('.save-view-modal__action-values');
        expect(sections[0].querySelectorAll(FILTER_STATUS_VALUE)).toHaveLength(1);
        expect(sections[0].querySelector(FILTER_STATUS_VALUE)).toHaveTextContent('DeletedField = x');
        expect(sections[1].querySelectorAll(FILTER_STATUS_VALUE)).toHaveLength(1);
        expect(sections[1].querySelector(FILTER_STATUS_VALUE)).toHaveTextContent('DeletedField');
    });

    const getCheckbox = (index: number): HTMLInputElement => {
        // index 0 is header, 1+ is data row
        const grid = document.querySelector(GRID_SELECTOR);
        const rows = grid.querySelectorAll('tr');
        const row = rows[index];
        return row.querySelector('input[type="checkbox"]');
    };

    const testSelectRow = async (
        rerender: (ui: React.ReactElement) => void,
        model: QueryModel,
        index: number,
        expectedState: boolean
    ): Promise<QueryModel> => {
        const row = model.gridData[index];
        const rowId = model.orderedRows[index];

        // The first tr is the header, so we increment the index by 1
        let checkbox = getCheckbox(index + 1);
        await userEvent.click(checkbox);
        expect(actions.selectRow).toHaveBeenCalledWith(model.id, expectedState, row, false);

        const newSelections = new Set(model.selections);
        if (expectedState) {
            newSelections.add(rowId);
        } else {
            newSelections.delete(rowId);
        }

        const newModel = model.mutate({ selections: newSelections });
        rerender(<GridPanel actions={actions} model={newModel} />);

        checkbox = getCheckbox(index + 1);
        expect(checkbox.checked).toEqual(expectedState);
        return newModel;
    };

    const testSelectPage = async (
        rerender: (ui: React.ReactElement) => void,
        model: QueryModel,
        expectedState: boolean
    ): Promise<QueryModel> => {
        let checkbox = getCheckbox(0);
        await userEvent.click(checkbox);
        expect(actions.selectPage).toHaveBeenCalledWith(model.id, expectedState);

        const newSelections = expectedState ? new Set<string>(model.orderedRows) : new Set<string>();
        const newModel = model.mutate({ selections: newSelections });

        rerender(<GridPanel actions={actions} model={newModel} />);

        checkbox = getCheckbox(0);
        expect(checkbox.checked).toEqual(expectedState);
        return newModel;
    };

    const expectHeaderSelectionStatus = (expectedState: boolean): void => {
        const checkbox = getCheckbox(0);
        expect(checkbox.checked).toEqual(expectedState);
    };

    const expectSelectionStatusCount = (model: QueryModel, count: number): void => {
        const selectionStatus = document.querySelector('.selection-status__count');
        if (count === 0) {
            expect(selectionStatus).toBeNull();
        } else {
            const total = model.rowCount;
            expect(selectionStatus.textContent).toEqual(`${count} of ${total} selected`);
        }
    };

    const expectClearButtonState = (text?: string): void => {
        const clearButton = document.querySelector(CLEAR_ALL_SELECTOR);

        if (text === undefined) {
            expect(clearButton).toBeNull();
        } else {
            expect(clearButton).not.toBeNull();
            expect(clearButton.textContent).toEqual(text);
        }
    };

    const testSelectAll = async (
        rerender: (ui: React.ReactElement) => void,
        model: QueryModel
    ): Promise<QueryModel> => {
        expect(document.querySelector('.selection-status')).toBeInTheDocument();
        expect(document.querySelector('.selection-status__select-all button')).toBeInTheDocument();
        await userEvent.click(document.querySelector('.selection-status__select-all button'));
        expect(actions.selectAllRows).toHaveBeenCalledWith(model.id);
        // Set selections to all to simulate actual behavior. This works because our model.rows object actually has
        // all 661 rows in it, which is not normal in production use.
        const newModel = model.mutate({ selections: new Set(Object.keys(model.rows)) });
        rerender(<GridPanel actions={actions} model={newModel} />);
        expectClearButtonState('Clear all');
        return newModel;
    };

    const testClearAll = async (rerender: (ui: React.ReactElement) => void, model: QueryModel): Promise<QueryModel> => {
        await userEvent.click(document.querySelector(CLEAR_ALL_SELECTOR + ' button'));
        expect(actions.clearSelections).toHaveBeenCalledWith(model.id);

        const newModel = model.mutate({ selections: new Set() });
        rerender(<GridPanel actions={actions} model={newModel} />);
        expectClearButtonState();
        return newModel;
    };

    test('Selections', async () => {
        const { rows, orderedRows, rowCount } = DATA;
        let model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows.slice(0, 20), rowCount).mutate({
            selections: new Set(),
            selectionsLoadingState: LoadingState.LOADED,
            totalCountLoadingState: LoadingState.LOADED,
        });
        const { rerender } = renderWithAppContext(<GridPanel actions={actions} model={model} />, {
            serverContext: {
                moduleContext: { query: { maxQuerySelection: 1500 } }, // Needed in order to test select all behavior
            },
        });

        // Check that with no selections the header checkbox is not selected.
        expectHeaderSelectionStatus(false);
        // Check that the clear button is not present
        expectClearButtonState();
        expectSelectionStatusCount(model, 0);

        // Select first row.
        model = await testSelectRow(rerender, model, 0, true);
        expectSelectionStatusCount(model, 1);
        expectClearButtonState('Clear');

        model = await testSelectRow(rerender, model, 1, true);
        expectSelectionStatusCount(model, 2);
        expectClearButtonState('Clear both');

        // We should expect the checkbox to not be checked, and we check the model for selectedState.
        expectHeaderSelectionStatus(false);
        expect(model.selectedState).toEqual(GRID_CHECKBOX_OPTIONS.SOME);

        // Since some rows are checked, checking the header checkbox again should result in de-selecting the rows.
        model = await testSelectPage(rerender, model, false);
        expectSelectionStatusCount(model, 0);
        expectClearButtonState();

        // Since no rows are checked, checking the header should select all rows on the page.
        model = await testSelectPage(rerender, model, true);
        expectSelectionStatusCount(model, 20);
        expectClearButtonState('Clear all');

        // Select all rows
        model = await testSelectAll(rerender, model);
        await testClearAll(rerender, model);
    });
});

describe('GridTitle', () => {
    const actions = makeTestActions(jest.fn);
    const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO);
    const testTitle = 'Test title';
    const GRID_TITLE_PROPS = {
        title: testTitle,
        actions,
        allowSelections: true,
        allowViewCustomization: false,
    };

    function validate(
        container: HTMLElement, // Changed from ReactWrapper
        expectedTitle: string,
        isEdited: boolean,
        allowCustomization: boolean,
        isDefaultView?: boolean,
        isHidden?: boolean
    ): void {
        expect(container).toHaveTextContent(expectedTitle);
        if (isEdited && allowCustomization) {
            const editedTag = container.querySelector('.view-edit-alert');
            expect(editedTag).toBeInTheDocument();
            expect(editedTag).toHaveTextContent('Edited');
            const buttons = container.querySelectorAll('button');
            let btnCount = 0;
            if (allowCustomization) {
                btnCount++;
                if (!isDefaultView && !isHidden) {
                    btnCount += 2;
                } else btnCount += 1;
            }

            expect(buttons).toHaveLength(btnCount);
        }
    }

    test('no title, no view', () => {
        const { container } = renderWithAppContext(
            <GridTitle actions={actions} allowSelections allowViewCustomization={false} model={model} />
        );
        expect(container.querySelector('.view-header')).toBeNull();
    });

    test('title, no view', () => {
        const { container } = renderWithAppContext(<GridTitle {...GRID_TITLE_PROPS} model={model} />, {
            serverContext: { user: TEST_USER_EDITOR },
        });
        validate(container, testTitle, false, false);
    });

    test('view, no title', () => {
        const viewSchemaQuery = new SchemaQuery('exp.data', 'mixtures', 'noExtraColumn');
        const modelWithView = makeTestQueryModel(viewSchemaQuery, QUERY_INFO);
        const { container } = renderWithAppContext(
            <GridTitle {...GRID_TITLE_PROPS} model={modelWithView} title={undefined} />, // explicitly remove title
            {
                serverContext: { user: TEST_USER_EDITOR },
            }
        );
        validate(container, 'No Extra Column', false, false);
    });

    test('title and view', () => {
        const viewSchemaQuery = new SchemaQuery('exp.data', 'mixtures', 'noExtraColumn');
        const modelWithView = makeTestQueryModel(viewSchemaQuery, QUERY_INFO);
        const { container } = renderWithAppContext(<GridTitle {...GRID_TITLE_PROPS} model={modelWithView} />, {
            serverContext: { user: TEST_USER_EDITOR },
        });
        validate(container, testTitle + ' - No Extra Column', false, false);
    });

    test('updated default view, with title', () => {
        const sessionQueryInfo = QUERY_INFO.mutate({
            views: QUERY_INFO.views.merge({
                '~~default~~': QUERY_INFO.views.get('~~default~~').mutate({
                    revertable: true,
                    session: true,
                }),
            }),
        });
        const model = makeTestQueryModel(SCHEMA_QUERY, sessionQueryInfo);
        const { container } = renderWithAppContext(
            <GridTitle {...GRID_TITLE_PROPS} allowViewCustomization model={model} />,
            { serverContext: { user: TEST_USER_PROJECT_ADMIN } }
        );
        validate(container, testTitle, true, true, true, false);
    });

    test('updated default view, with title, not customizable', () => {
        const sessionQueryInfo = QUERY_INFO.mutate({
            views: QUERY_INFO.views.merge({
                '~~default~~': QUERY_INFO.views.get('~~default~~').mutate({
                    revertable: true,
                    session: true,
                }),
            }),
        });
        const model = makeTestQueryModel(SCHEMA_QUERY, sessionQueryInfo);

        const { container } = renderWithAppContext(
            <GridTitle {...GRID_TITLE_PROPS} allowViewCustomization={false} model={model} />,
            { serverContext: { user: TEST_USER_READER } }
        );
        validate(container, testTitle, true, false, true, false);
    });

    test('updated named view, no title, customizable', () => {
        const viewSchemaQuery = new SchemaQuery('exp.data', 'mixtures', 'noExtraColumn');
        const sessionQueryInfo = QUERY_INFO.mutate({
            views: QUERY_INFO.views.merge({
                noextracolumn: QUERY_INFO.views.get('noextracolumn').mutate({
                    revertable: true,
                    session: true,
                }),
            }),
        });
        const model = makeTestQueryModel(viewSchemaQuery, sessionQueryInfo);
        const { container } = renderWithAppContext(
            <GridTitle {...GRID_TITLE_PROPS} allowViewCustomization model={model} title={undefined} />,
            { serverContext: { user: TEST_USER_PROJECT_ADMIN } }
        );
        validate(container, 'No Extra Column', true, true, false, false);
    });

    test('updated named view with title', () => {
        const viewSchemaQuery = new SchemaQuery('exp.data', 'mixtures', 'noExtraColumn');
        const sessionQueryInfo = QUERY_INFO.mutate({
            views: QUERY_INFO.views.merge({
                noextracolumn: QUERY_INFO.views.get('noextracolumn').mutate({
                    revertable: true,
                    session: true,
                }),
            }),
        });
        const model = makeTestQueryModel(viewSchemaQuery, sessionQueryInfo);
        const { container } = renderWithAppContext(
            <GridTitle {...GRID_TITLE_PROPS} allowViewCustomization model={model} />,
            { serverContext: { user: TEST_USER_READER } }
        );
        validate(container, testTitle + ' - No Extra Column', true, true, false, false);
    });

    test('hidden view, edited', () => {
        const viewSchemaQuery = new SchemaQuery('exp.data', 'mixtures', 'noExtraColumn');
        const sessionQueryInfo = QUERY_INFO.mutate({
            views: QUERY_INFO.views.merge({
                noextracolumn: QUERY_INFO.views.get('noextracolumn').mutate({
                    hidden: true,
                    revertable: true,
                    session: true,
                }),
            }),
        });
        const model = makeTestQueryModel(viewSchemaQuery, sessionQueryInfo);
        const { container } = renderWithAppContext(
            <GridTitle {...GRID_TITLE_PROPS} allowViewCustomization model={model} />,
            { serverContext: { user: TEST_USER_READER } }
        );
        validate(container, testTitle, true, true, false, true);
    });

    test('hidden view, edited, no title', () => {
        const viewSchemaQuery = new SchemaQuery('exp.data', 'mixtures', 'noExtraColumn');
        const sessionQueryInfo = QUERY_INFO.mutate({
            views: QUERY_INFO.views.merge({
                noextracolumn: QUERY_INFO.views.get('noextracolumn').mutate({
                    hidden: true,
                    revertable: true,
                    session: true,
                }),
            }),
        });
        const model = makeTestQueryModel(viewSchemaQuery, sessionQueryInfo);
        const { container } = renderWithAppContext(
            <GridTitle actions={actions} allowSelections allowViewCustomization model={model} />,
            { serverContext: { user: TEST_USER_READER } }
        );
        // Title defaults to 'Default View' when no title is provided
        validate(container, 'Default View', true, true, false, true);
    });

    // GitHub Issue #899
    const renderSaveCurrentView = (onSaveView: jest.Mock, path: string, type: string) => {
        const viewSchemaQuery = new SchemaQuery('exp.data', 'mixtures', 'noExtraColumn');
        const sessionQueryInfo = QUERY_INFO.mutate({
            views: QUERY_INFO.views.merge({
                noextracolumn: QUERY_INFO.views.get('noextracolumn').mutate({ inherit: true, session: true }),
            }),
        });
        return renderWithAppContext(
            <GridTitle
                {...GRID_TITLE_PROPS}
                allowViewCustomization
                model={makeTestQueryModel(viewSchemaQuery, sessionQueryInfo)}
                onSaveView={onSaveView}
            />,
            {
                serverContext: {
                    user: TEST_USER_PROJECT_ADMIN,
                    container: { path, type },
                    moduleContext: { query: { isProductFoldersEnabled: true } },
                },
            }
        );
    };

    test('save current view from a subfolder does not inherit', async () => {
        const onSaveView = jest.fn();
        const { container } = renderSaveCurrentView(onSaveView, '/project/a', 'folder');

        await userEvent.click(container.querySelector('.split-button-dropdown__button'));

        // the inherited view lives in the home folder, so a subfolder save must shadow it rather than target it
        expect(onSaveView).toHaveBeenCalledWith(true, false);
    });

    test('save current view from the home folder keeps inherit', async () => {
        const onSaveView = jest.fn();
        const { container } = renderSaveCurrentView(onSaveView, '/project', 'project');

        await userEvent.click(container.querySelector('.split-button-dropdown__button'));

        expect(onSaveView).toHaveBeenCalledWith(true, true);
    });

    test('hidden view, not edited, no title', () => {
        const viewSchemaQuery = new SchemaQuery('exp.data', 'mixtures', 'noExtraColumn');
        const sessionQueryInfo = QUERY_INFO.mutate({
            views: QUERY_INFO.views.merge({
                noextracolumn: QUERY_INFO.views.get('noextracolumn').mutate({ hidden: true }),
            }),
        });
        const model = makeTestQueryModel(viewSchemaQuery, sessionQueryInfo);
        const { container } = renderWithAppContext(
            <GridTitle actions={actions} allowSelections allowViewCustomization={false} model={model} />
        );
        expect(container.querySelector('.view-header')).toBeNull();
    });
});
