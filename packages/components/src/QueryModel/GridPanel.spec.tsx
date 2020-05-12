import React, { PureComponent } from 'react';
import { mount } from 'enzyme';

import { GridPanel, LoadingState, QueryInfo, SchemaQuery } from '..';

import { initUnitTests, makeQueryInfo, makeTestData } from '../testHelpers';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../test/data/mixtures-getQueryPaging.json';

import { RequiresModelAndActions } from './withQueryModels';
import { RowsResponse } from './QueryModelLoader';
import { makeTestActions, makeTestModel } from './testUtils';

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO: QueryInfo;
let DATA: RowsResponse;

class TestButtons extends PureComponent<RequiresModelAndActions> {
    render() {
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

const PAGINATION_SELECTOR = '.pagination-button-group';
const PAGINATION_INFO_SELECTOR = '.pagination-info';
const PAGE_SIZE_SELECTOR = '.page-size-menu'
const VIEW_MENU_SELECTOR = '.view-menu';
const GRID_SELECTOR = '.grid-panel__grid .table-responsive';
const GRID_INFO_SELECTOR = '.grid-panel__info';
const EXPORT_MENU_SELECTOR = '.export-menu';
const OMNIBOX_SELECTOR = '.grid-panel__omnibox OmniBox';
const DISABLED_BUTTON_CLASS = 'disabled-button-with-tooltip';

describe('GridPanel', () => {
    let actions;

    beforeEach(() => {
        actions = makeTestActions();
    });

    test('Render GridPanel', () => {
        const { rows, orderedRows, rowCount } = DATA;

        // Model is loading QueryInfo and Rows, should render loading, disabled ChartSelector, no pagination/ViewMenu.
        let model = makeTestModel(SCHEMA_QUERY);
        const wrapper = mount(<GridPanel actions={actions} model={model} />);
        expect(wrapper.find('button#chart-menu-model[disabled]').exists()).toEqual(true);
        expect(wrapper.find(PAGINATION_INFO_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(PAGINATION_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(false);
        // OmniBox should be present, but disabled when we're loading
        expect(wrapper.find(OMNIBOX_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(OMNIBOX_SELECTOR).props().disabled).toEqual(true);

        // Model is loading Rows, but not QueryInfo, should not render pagination, should render disabled ViewMenu.
        model = model.mutate({ queryInfoLoadingState: LoadingState.LOADED, queryInfo: QUERY_INFO });
        wrapper.setProps({ model });
        expect(wrapper.find(PAGINATION_INFO_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(PAGINATION_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(OMNIBOX_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(OMNIBOX_SELECTOR).props().disabled).toEqual(true);

        // Loaded rows and QueryInfo. Should render grid, pagination, ViewMenu, ChartMenu
        model = model.mutate({ rows, orderedRows: orderedRows.slice(0, 20), rowCount, rowsLoadingState: LoadingState.LOADED });
        wrapper.setProps({ model });
        expect(wrapper.find(PAGINATION_INFO_SELECTOR).text()).toEqual('1 - 20 of 661');
        expect(wrapper.find(PAGINATION_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(OMNIBOX_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(OMNIBOX_SELECTOR).props().disabled).toEqual(false);

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
        expect(wrapper.find(PAGINATION_INFO_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(PAGINATION_SELECTOR).exists()).toEqual(true);
        paginationButtons = wrapper.find(PAGINATION_SELECTOR).find('button');
        expect(paginationButtons.first().hasClass(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(paginationButtons.last().hasClass(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(wrapper.find(GRID_INFO_SELECTOR).text()).toContain('Loading data...');

        // Should render TestButtons component in the left part of the grid bar.
        wrapper.setProps({ ButtonsComponent: TestButtons });
        expect(wrapper.find(TestButtons).exists()).toEqual(true);

        // Panel classes should not be present.
        wrapper.setProps({ asPanel: false });
        expect(wrapper.find('.grid-panel').hasClass('panel')).toEqual(false);
        expect(wrapper.find('.grid-panel').hasClass('panel-default')).toEqual(false);

        // pageSizes should be different
        expect(wrapper.find(PAGE_SIZE_SELECTOR).find('ul').text()).toEqual('Page Size2040100250400');
        wrapper.setProps({ pageSizes: [5, 10, 15, 20] });
        expect(wrapper.find(PAGE_SIZE_SELECTOR).find('ul').text()).toEqual('Page Size5101520');

        // Pagination should not be present.
        wrapper.setProps({ isPaged: false });
        expect(wrapper.find(PAGINATION_INFO_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(PAGINATION_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(PAGE_SIZE_SELECTOR).exists()).toEqual(false);

        // ViewMenu should not be present.
        wrapper.setProps({ showViewSelector: false });
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(false);

        // export menu should not be rendered.
        wrapper.setProps({ showExport: false });
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(false);
    });
});
