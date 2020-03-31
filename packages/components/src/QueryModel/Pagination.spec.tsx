import React from 'react';
import renderer from 'react-test-renderer';
import { Actions, initQueryGridState, QueryModel, SchemaQuery } from '..';
import { initMockServerContext } from '../testHelpers';
import { applyQueryMetadata } from '../query/api';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import { LoadingState } from './QueryModel';
import { PageSelector, PaginationButtons, PaginationInfo } from './Pagination';
import { mount } from 'enzyme';

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO;

beforeAll(() => {
    initMockServerContext({
        container: {
            formats: {
                dateFormat: 'yyyy-MM-dd',
                dateTimeFormat: 'yyyy-MM-dd HH:mm',
                numberFormat: null,
            },
            path: 'testContainer',
        },
        contextPath: 'labkey',
    });
    initQueryGridState();
    // Have to instantiate QUERY_INFO here because it relies on initQueryGridState being called first.
    QUERY_INFO = applyQueryMetadata(mixturesQueryInfo);
});

describe('Pagination', () => {
    let model;
    let actions;

    const createTestModel = (withData = false) => {
        const _model = new QueryModel({ id: 'model', schemaQuery: SCHEMA_QUERY });
        _model.rowCount = 661;
        _model.queryInfo = QUERY_INFO;
        _model.rowsLoadingState = LoadingState.LOADED;
        _model.queryInfoLoadingState = LoadingState.LOADED;

        if (withData) {
            _model.rows = {};
        }

        return _model;
    };

    beforeEach(() => {
        model = createTestModel();
        actions = {
            loadFirstPage: jest.fn(),
            loadLastPage: jest.fn(),
            loadPreviousPage: jest.fn(),
            loadNextPage: jest.fn(),
        };
        // Coerce to Actions.
        actions = actions as unknown;
        actions = actions as Actions;
    });

    test('PaginationInfo', () => {
        let tree = renderer.create(<PaginationInfo model={model} />);
        // no data, will render empty div
        expect(tree.toJSON()).toMatchSnapshot();

        // 1 - 20 of 661
        model.rows = {};
        tree = renderer.create(<PaginationInfo model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // 1 - 40 of 661
        model.maxRows = 40;
        tree = renderer.create(<PaginationInfo model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // 41 - 80 of 661
        model.offset = 40;
        tree = renderer.create(<PaginationInfo model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // 1 - 4
        model.offset = 0;
        model.rowCount = 4;
        tree = renderer.create(<PaginationInfo model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('PageSelector', () => {
        // Shouldn't render anything, model doesn't have rows.
        let tree = renderer.create(<PageSelector model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render with page count 34
        model.rows = {};
        tree = renderer.create(<PageSelector model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Shouldn't render, not enough rows.
        model.rowCount = 5;
        tree = renderer.create(<PageSelector model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render '...' for pageCount, disabled first/last page MenutItems.
        model.rowCount  = 661;
        model.rowsLoadingState = LoadingState.LOADING;
        tree = renderer.create(<PageSelector model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        model.rowsLoadingState = LoadingState.LOADED;
        const wrapper = mount(<PageSelector model={model} actions={actions} />);
        wrapper.find('MenuItem').at(1).find('a').simulate('click');
        expect(actions.loadFirstPage).toHaveBeenCalledWith('model');
        wrapper.find('MenuItem').at(2).find('a').simulate('click');
        expect(actions.loadLastPage).toHaveBeenCalledWith('model');
    });

    test('PaginationButtons', () => {
        // Shouldn't render anything, model doesn't have rows.
        let tree = renderer.create(<PaginationButtons model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render everything including PageSelector with "34 Total pages".
        model.rows = {};
        tree = renderer.create(<PaginationButtons model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render nothing because not enough rows to page.
        model.rowCount = 5;
        tree = renderer.create(<PaginationButtons model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render disabled next/prev/first/last buttons/menu items because we're loading.
        model.rowCount = 661;
        model.rowsLoadingState = LoadingState.LOADING;
        tree = renderer.create(<PaginationButtons model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        model = createTestModel(true);
        const wrapper = mount(<PaginationButtons model={model} actions={actions} />);
        wrapper.find('PagingButton').first().simulate('click');
        // Button is disabled (because we're on the first page) so the click handler is never called.
        expect(actions.loadPreviousPage).toHaveBeenCalledTimes(0);

        model = createTestModel(true);
        model.offset = model.lastPageOffset;
        wrapper.setProps({ model, actions });
        wrapper.find('PagingButton').first().simulate('click');
        expect(actions.loadPreviousPage).toHaveBeenCalledWith('model');
        wrapper.find('PagingButton').last().simulate('click');
        // Button is disabled (because we're on the last page) so the click handler is never called.
        expect(actions.loadNextPage).toHaveBeenCalledTimes(0);

        model = createTestModel(true);
        model.offset = 0;
        wrapper.setProps({ model, actions });
        wrapper.find('PagingButton').last().simulate('click');
        expect(actions.loadNextPage).toHaveBeenCalledWith('model');
    });
});
