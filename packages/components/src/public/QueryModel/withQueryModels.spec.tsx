import React, { ReactElement } from 'react';
import { mount } from 'enzyme';
import { createMemoryHistory, InjectedRouter, Route, Router } from 'react-router';
import { Filter } from '@labkey/api';

import { enableMapSet } from 'immer';

import { makeQueryInfo, makeTestData, sleep } from '../../internal/test/testHelpers';
import { MockQueryModelLoader } from '../../test/MockQueryModelLoader';
import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../../test/data/mixtures-getQueryPaging.json';
import aminoAcidsQueryInfo from '../../test/data/assayAminoAcidsData-getQueryDetails.json';
import aminoAcidsQuery from '../../test/data/assayAminoAcidsData-getQuery.json';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';

import { LoadingState } from '../LoadingState';

import { QuerySort } from '../QuerySort';

import { waitForLifecycle } from '../../internal/test/enzymeTestHelpers';

import { Actions, QueryModelMap, withQueryModels } from './withQueryModels';
import { QueryModel } from './QueryModel';

import { RowsResponse } from './QueryModelLoader';

/**
 * Note: All of the tests in this file look a tad weird. We create a component that resets local variables on render
 * instead of grabbing props or state from the wrapper variable. This is because no matter what I tried I could not
 * get the wrapper to return the updated model via props(), but for some reason the weird render hack works. It also
 * works consistently, and lets us have fine grained control over the lifecycle via calls to sleep. If you have a
 * better idea by all means try it.
 */

const MIXTURES_SCHEMA_QUERY = new SchemaQuery('exp.data', 'mixtures');
let MIXTURES_QUERY_INFO: QueryInfo;
let MIXTURES_DATA: RowsResponse;
const AMINO_ACIDS_SCHEMA_QUERY = new SchemaQuery('assay.General.Amino Acids', 'Runs');
let AMINO_ACIDS_QUERY_INFO: QueryInfo;
let AMINO_ACIDS_DATA: RowsResponse;

beforeAll(() => {
    enableMapSet();
    MIXTURES_QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
    AMINO_ACIDS_QUERY_INFO = makeQueryInfo(aminoAcidsQueryInfo);
    AMINO_ACIDS_DATA = makeTestData(aminoAcidsQuery);
    MIXTURES_DATA = makeTestData(mixturesQuery);
});

describe('withQueryModels', () => {
    test('actions', async () => {
        const modelLoader = new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        let injectedModels: QueryModelMap;
        let injectedModel: QueryModel;
        let injectedActions: Actions;
        const TestComponentImpl = ({ queryModels, actions }): ReactElement => {
            injectedModels = queryModels;
            injectedModel = queryModels.model;
            injectedActions = actions;
            return <div />;
        };
        const WrappedComponent = withQueryModels<{}>(TestComponentImpl);
        const queryConfigs = { model: { schemaQuery: MIXTURES_SCHEMA_QUERY } };
        // Wrapper is technically used.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const wrapper = mount(<WrappedComponent queryConfigs={queryConfigs} modelLoader={modelLoader} />);
        // When we first mount a component we initialize rows and queryInfo to undefined with loading states set to
        // loading.
        expect(injectedModel.queryInfo).toEqual(undefined);
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.rows).toEqual(undefined);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.INITIALIZED);

        // Trigger load model like a consuming component would in componentDidMount.
        injectedActions.loadModel(injectedModel.id);
        // We can expect that LoadingState for QueryInfo should be LOADING, but rows should still be INITIALIZED
        // because we can't even try until we have a QueryInfo.
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.INITIALIZED);

        await sleep(); // Sleep to let lifecycle methods do their thing.

        // QueryInfo should be loaded, rows should now be loading.
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADED);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep(); // Sleep to let lifecycle methods do their thing.

        // Rows should be loaded.
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        // We're on the first page, so loading the previous page should do nothing.
        let expectedOffset = injectedModel.offset;
        injectedActions.loadPreviousPage(injectedModel.id);
        expect(injectedModel.offset).toEqual(expectedOffset);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        // Loading next page should trigger loading status and increment the offset.
        expectedOffset = injectedModel.offset + injectedModel.maxRows;
        injectedActions.loadNextPage(injectedModel.id);
        expect(injectedModel.offset).toEqual(expectedOffset);
        expect(injectedModel.currentPage).toEqual(2);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep();

        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);
        // loadLastPage should set the offset to the last page offset and trigger loading.
        injectedActions.loadLastPage(injectedModel.id);
        expectedOffset = injectedModel.lastPageOffset;
        expect(injectedModel.offset).toEqual(expectedOffset);
        expect(injectedModel.currentPage).toEqual(34);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep();

        // loadNextPage should do nothing.
        expectedOffset = injectedModel.offset;
        injectedActions.loadNextPage(injectedModel.id);
        expect(injectedModel.offset).toEqual(expectedOffset);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        // loadPrevious page should change the offset.
        expectedOffset = injectedModel.offset - injectedModel.maxRows;
        injectedActions.loadPreviousPage(injectedModel.id);
        expect(injectedModel.offset).toEqual(expectedOffset);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep();

        expectedOffset = 0;
        injectedActions.loadFirstPage(injectedModel.id);
        expect(injectedModel.offset).toEqual(expectedOffset);
        expect(injectedModel.currentPage).toEqual(1);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep();

        expectedOffset = injectedModel.maxRows * 2;
        injectedActions.setOffset(injectedModel.id, expectedOffset);
        expect(injectedModel.offset).toEqual(expectedOffset);
        expect(injectedModel.currentPage).toEqual(3);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep();

        // setMaxRows should change maxRows and reset offset to 0.
        injectedActions.setMaxRows(injectedModel.id, 40);
        expect(injectedModel.maxRows).toEqual(40);
        expect(injectedModel.offset).toEqual(0);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep();
        // loadNextPage so we can confirm that changing schemaQuery resets offset.
        injectedActions.loadNextPage(injectedModel.id);

        await sleep();

        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);
        modelLoader.queryInfo = AMINO_ACIDS_QUERY_INFO;
        modelLoader.rowsResponse = AMINO_ACIDS_DATA;
        // Changing schemaQuery resets all rows and queryInfo related data.
        injectedActions.setSchemaQuery(injectedModel.id, AMINO_ACIDS_SCHEMA_QUERY);
        expect(injectedModel.schemaQuery).toBe(AMINO_ACIDS_SCHEMA_QUERY);
        expect(injectedModel.queryInfo).toEqual(undefined);
        expect(injectedModel.queryInfoLoadingState).toBe(LoadingState.LOADING);
        expect(injectedModel.offset).toEqual(0);
        expect(injectedModel.rows).toEqual(undefined);
        expect(injectedModel.orderedRows).toEqual(undefined);
        expect(injectedModel.rowCount).toEqual(undefined);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.INITIALIZED);

        await sleep();

        // QueryInfo should be loaded, rows should now be loading.
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADED);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep();

        // We should have messages now.
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);
        expect(injectedModel.messages).toBe(AMINO_ACIDS_DATA.messages);

        // Changing view is basically the same as changing the schemaQuery.
        const viewName = 'FakeView';
        injectedActions.setView(injectedModel.id, viewName);
        expect(injectedModel.schemaQuery.viewName).toEqual(viewName);
        expect(injectedModel.offset).toEqual(0);
        expect(injectedModel.rows).toEqual(undefined);
        expect(injectedModel.orderedRows).toEqual(undefined);
        expect(injectedModel.rowCount).toEqual(undefined);
        expect(injectedModel.messages).toEqual(undefined);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep();

        let error = 'Something really bad happened!';
        modelLoader.rowsException = { exception: error };
        injectedActions.loadRows(injectedModel.id);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep();

        // Expect resolveError message to extract the error.
        expect(injectedModel.rowsError).toEqual(error);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        error = 'Error loading QueryInfo';
        modelLoader.queryInfoException = { exception: error };
        injectedActions.loadModel(injectedModel.id);
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADING);

        await sleep();

        // Expect resolveError to extract the error.
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADED);
        expect(injectedModel.queryInfoError).toEqual(error);

        // Reset modelLoader.
        modelLoader.queryInfoException = undefined;
        modelLoader.rowsException = undefined;
        modelLoader.queryInfo = MIXTURES_QUERY_INFO;
        modelLoader.rowsResponse = MIXTURES_DATA;

        // Expect addModel to add a new model.
        injectedActions.addModel({ id: 'model2', schemaQuery: MIXTURES_SCHEMA_QUERY }, false);
        const model2 = injectedModels.model2;
        expect(model2).not.toEqual(undefined);
        expect(model2.id).toEqual('model2');
        expect(model2.schemaQuery).toBe(MIXTURES_SCHEMA_QUERY);
        expect(model2.queryInfoLoadingState).toEqual(LoadingState.INITIALIZED);
        expect(model2.rowsLoadingState).toEqual(LoadingState.INITIALIZED);

        await sleep();

        // Double check that we're not trying to load model2.
        expect(model2.queryInfoLoadingState).toEqual(LoadingState.INITIALIZED);
        expect(model2.rowsLoadingState).toEqual(LoadingState.INITIALIZED);

        // withQueryModels should load this model.
        injectedActions.addModel({ id: 'model3', schemaQuery: MIXTURES_SCHEMA_QUERY }, true);
        let model3 = injectedModels.model3;
        expect(model3).not.toEqual(undefined);
        expect(model3.id).toEqual('model3');
        expect(model3.schemaQuery).toBe(MIXTURES_SCHEMA_QUERY);
        expect(model3.queryInfoLoadingState).toEqual(LoadingState.LOADING);
        expect(model3.rowsLoadingState).toEqual(LoadingState.INITIALIZED);

        await sleep();
        model3 = injectedModels.model3;
        expect(model3.queryInfoLoadingState).toEqual(LoadingState.LOADED);
        expect(model3.rowsLoadingState).toEqual(LoadingState.LOADING);

        await sleep();
        model3 = injectedModels.model3;
        expect(model3.rowsLoadingState).toEqual(LoadingState.LOADED);

        // selectRow
        // Select a single row
        const selectionKey = injectedModel.orderedRows[0];
        const selectedRow = injectedModel.getRow(selectionKey);
        injectedActions.selectRow(injectedModel.id, true, selectedRow);
        await waitForLifecycle(wrapper);

        expect(injectedModel.selections.has(selectionKey)).toBe(true);
        expect(injectedModel.selectionPivot).toEqual({ checked: true, selection: selectionKey });

        // useSelectionPivot for multiple rows
        const nextSelectionKey = injectedModel.orderedRows[5];
        const nextSelectedRow = injectedModel.getRow(nextSelectionKey);
        injectedActions.selectRow(injectedModel.id, true, nextSelectedRow, true);
        await waitForLifecycle(wrapper);

        expect(injectedModel.selections.size).toEqual(6);
        expect(injectedModel.selectionPivot).toEqual({ checked: true, selection: selectionKey });

        injectedActions.clearSelections(injectedModel.id);
        await waitForLifecycle(wrapper);

        expect(injectedModel.selections.size).toEqual(0);
        expect(injectedModel.selectionPivot).toBeUndefined();
    });

    test('Bind from URL', async () => {
        const modelLoader = new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        const history = createMemoryHistory();
        const queryConfigs = { model: { schemaQuery: MIXTURES_SCHEMA_QUERY, bindURL: true } };
        const queryParams: Record<string, string> = {};
        let injectedModel: QueryModel;
        let injectedRouter: InjectedRouter;
        let injectedLocation;
        const TestComponentImpl = ({ actions, location, queryModels, router }): ReactElement => {
            injectedModel = queryModels.model;
            injectedRouter = router;
            injectedLocation = location;
            return <div />;
        };
        const WrappedComponent = withQueryModels<{}>(TestComponentImpl);
        const wrapper = mount(
            <Router history={history}>
                <Route
                    path="/"
                    component={() => (
                        <WrappedComponent autoLoad modelLoader={modelLoader} queryConfigs={queryConfigs} />
                    )}
                />
            </Router>
        );
        await sleep(); // Sleep so QueryInfo gets loaded.
        await sleep(); // Sleep so Rows get loaded.

        queryParams['query.p'] = '2';
        injectedRouter.replace({ ...injectedLocation, query: { ...queryParams } });
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.offset).toEqual(20);
        await sleep(); // Load Rows
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        queryParams['query.view'] = 'noMixtures';
        injectedRouter.replace({ ...injectedLocation, query: { ...queryParams } });
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.schemaQuery.viewName).toEqual('noMixtures');
        await sleep(); // Load Rows
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        queryParams['query.Name~eq'] = 'DMXP';
        injectedRouter.replace({ ...injectedLocation, query: { ...queryParams } });
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.filterArray.length).toEqual(1);
        const filter = injectedModel.filterArray[0];
        expect(filter.getColumnName()).toEqual('Name');
        expect(filter.getValue()).toEqual('DMXP');
        expect(filter.getFilterType()).toEqual(Filter.Types.EQUAL);
        await sleep(); // Load Rows
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        queryParams['query.sort'] = 'Name';
        injectedRouter.replace({ ...injectedLocation, query: { ...queryParams } });
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.sorts.length).toEqual(1);
        let sort = injectedModel.sorts[0];
        expect(sort.fieldKey).toEqual('Name');
        expect(sort.dir).toEqual('');
        await sleep(); // Load Rows
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        queryParams['query.sort'] = 'Name,-expirationTime';
        injectedRouter.replace({ ...injectedLocation, query: { ...queryParams } });
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.sorts.length).toEqual(2);
        sort = injectedModel.sorts[1];
        expect(sort.fieldKey).toEqual('expirationTime');
        expect(sort.dir).toEqual('-');
        await sleep(); // Load Rows
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        queryParams['query.reportId'] = 'db:1';
        injectedRouter.replace({ ...injectedLocation, query: { ...queryParams } });
        // Selecting a report doesn't trigger loading rows.
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.selectedReportId).toEqual('db:1');
    });

    test('Bind to URL', async () => {
        const modelLoader = new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        const history = createMemoryHistory();
        const queryConfigs = { model: { schemaQuery: MIXTURES_SCHEMA_QUERY, bindURL: true } };
        let injectedModel: QueryModel;
        let injectedActions: Actions;
        let injectedLocation;
        const TestComponentImpl = ({ actions, location, queryModels, router }): ReactElement => {
            injectedModel = queryModels.model;
            injectedActions = actions;
            injectedLocation = location;
            return <div />;
        };
        const WrappedComponent = withQueryModels<{}>(TestComponentImpl);
        const wrapper = mount(
            <Router history={history}>
                <Route
                    path="/"
                    component={() => (
                        <WrappedComponent autoLoad modelLoader={modelLoader} queryConfigs={queryConfigs} />
                    )}
                />
            </Router>
        );
        await sleep(); // Sleep so QueryInfo gets loaded.
        await sleep(); // Sleep so Rows get loaded.

        let expectedQuery: Record<string, string> = { 'query.p': '34' };
        injectedActions.loadLastPage(injectedModel.id);
        await sleep();
        expect(injectedLocation.query).toEqual(expectedQuery);

        injectedActions.loadFirstPage(injectedModel.id);
        await sleep();
        // Setting the page to 1 removes the "p" param from the URL.
        expect(injectedLocation.query).toEqual({});

        expectedQuery['query.p'] = '2';
        injectedActions.loadNextPage(injectedModel.id);
        await sleep();
        expect(injectedLocation.query).toEqual(expectedQuery);

        // Setting a filter resets offset to 0, so we dont' expect "p" to stick around.
        expectedQuery = { 'query.Name~eq': 'DMXP' };
        injectedActions.setFilters(injectedModel.id, [Filter.create('Name', 'DMXP', Filter.Types.EQUAL)]);
        await sleep();
        expect(injectedLocation.query).toEqual(expectedQuery);

        expectedQuery['query.sort'] = '-Name,expirationTime';
        injectedActions.setSorts(injectedModel.id, [
            new QuerySort({ fieldKey: 'Name', dir: '-' }),
            new QuerySort({ fieldKey: 'expirationTime', dir: '' }),
        ]);
        await sleep();
        expect(injectedLocation.query).toEqual(expectedQuery);

        expectedQuery['query.view'] = 'noMixtures';
        injectedActions.setView(injectedModel.id, 'noMixtures');
        await sleep();
        expect(injectedLocation.query).toEqual(expectedQuery);

        expectedQuery['query.reportId'] = 'db:1';
        injectedActions.selectReport(injectedModel.id, 'db:1');
        expect(injectedLocation.query).toEqual(expectedQuery);
    });
});
