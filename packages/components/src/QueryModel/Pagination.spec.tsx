import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { Actions, QueryInfo, SchemaQuery } from '..';

import { initUnitTests, makeQueryInfo } from '../testHelpers';

import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';

import { LoadingState, QueryModel } from './QueryModel';
import { PageSelector, PaginationButtons, PaginationInfo } from './Pagination';
import { makeTestActions, makeTestModel } from './testUtils';

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO: QueryInfo;

beforeAll(() => {
    initUnitTests();
    // Have to instantiate QUERY_INFO here because it relies on initQueryGridState being called first.
    QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
});

describe('Pagination', () => {
    let model: QueryModel;
    let actions: Actions;

    beforeEach(() => {
        model = makeTestModel(SCHEMA_QUERY, QUERY_INFO).mutate({
            rowCount: 661,
            rowsLoadingState: LoadingState.LOADED,
        });
        actions = makeTestActions();
    });

    test('PaginationInfo', () => {
        let tree = renderer.create(<PaginationInfo model={model} />);
        // no data, will render empty div
        expect(tree.toJSON()).toMatchSnapshot();

        // 1 - 20 of 661
        model = model.mutate({ rows: {} });
        tree = renderer.create(<PaginationInfo model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // 1 - 40 of 661
        model = model.mutate({ maxRows: 40 });
        tree = renderer.create(<PaginationInfo model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // 41 - 80 of 661
        model = model.mutate({ offset: 40 });
        tree = renderer.create(<PaginationInfo model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // 1 - 4
        model = model.mutate({
            offset: 0,
            rowCount: 4,
        });
        tree = renderer.create(<PaginationInfo model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('PageSelector', () => {
        // Shouldn't render anything, model doesn't have rows.
        let tree = renderer.create(<PageSelector model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render with page count 34
        model = model.mutate({ rows: {} });
        tree = renderer.create(<PageSelector model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Shouldn't render, not enough rows.
        model = model.mutate({ rowCount: 5 });
        tree = renderer.create(<PageSelector model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render '...' for pageCount, disabled first/last page MenutItems.
        model = model.mutate({
            rowCount: 661,
            rowsLoadingState: LoadingState.LOADING,
        });
        tree = renderer.create(<PageSelector model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        model = model.mutate({ rowsLoadingState: LoadingState.LOADED });
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
        model = model.mutate({ rows: {} });
        tree = renderer.create(<PaginationButtons model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render nothing because not enough rows to page.
        model = model.mutate({ rowCount: 5 });
        tree = renderer.create(<PaginationButtons model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render disabled next/prev/first/last buttons/menu items because we're loading.
        model = model.mutate({
            rowCount: 661,
            rowsLoadingState: LoadingState.LOADING,
        });
        tree = renderer.create(<PaginationButtons model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();

        model = makeTestModel(SCHEMA_QUERY, QUERY_INFO, {}, []);
        model = model.mutate({ rowCount: 661 });
        const wrapper = mount(<PaginationButtons model={model} actions={actions} />);
        wrapper.find('PagingButton').first().simulate('click');
        // Button is disabled (because we're on the first page) so the click handler is never called.
        expect(actions.loadPreviousPage).toHaveBeenCalledTimes(0);

        model = model.mutate({ offset: model.lastPageOffset });
        wrapper.setProps({ model, actions });
        wrapper.find('PagingButton').first().simulate('click');
        expect(actions.loadPreviousPage).toHaveBeenCalledWith('model');
        wrapper.find('PagingButton').last().simulate('click');
        // Button is disabled (because we're on the last page) so the click handler is never called.
        expect(actions.loadNextPage).toHaveBeenCalledTimes(0);

        model = model.mutate({ offset: 0 });
        wrapper.setProps({ model, actions });
        wrapper.find('PagingButton').last().simulate('click');
        expect(actions.loadNextPage).toHaveBeenCalledWith('model');
    });
});
