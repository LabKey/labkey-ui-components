import React from 'react';
import { mount } from 'enzyme';

import { Actions, LoadingState, QueryInfo, QueryModel, QueryModelMap, SchemaQuery, withQueryModels } from '..';

import { initUnitTests, makeQueryInfo, makeTestData, sleep } from '../testHelpers';
import { MockQueryModelLoader } from '../test/MockQueryModelLoader';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../test/data/mixtures-getQueryPaging.json';
import aminoAcidsQueryInfo from '../test/data/assayAminoAcidsData-getQueryDetails.json';
import aminoAcidsQuery from '../test/data/assayAminoAcidsData-getQuery.json';

import { RowsResponse } from './QueryModelLoader';

const MIXTURES_SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let MIXTURES_QUERY_INFO: QueryInfo;
let MIXTURES_DATA: RowsResponse;
const AMINO_ACIDS_SCHEMA_QUERY = SchemaQuery.create('assay.General.Amino Acids', 'Runs');
let AMINO_ACIDS_QUERY_INFO: QueryInfo;
let AMINO_ACIDS_DATA: RowsResponse;

beforeAll(async () => {
    initUnitTests();
    MIXTURES_QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
    AMINO_ACIDS_QUERY_INFO = makeQueryInfo(aminoAcidsQueryInfo);
    AMINO_ACIDS_DATA = await makeTestData(aminoAcidsQuery);
    // Return so tests don't start till after the promise resolves, so we can guarantee MIXTURES_DATA is initialized in tests.
    return (MIXTURES_DATA = await makeTestData(mixturesQuery));
});

describe('withQueryModels', () => {
    test('actions', async done => {
        const modelLoader = new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        let injectedModels: QueryModelMap;
        let injectedModel: QueryModel;
        let injectedActions: Actions;
        const TestComponentImpl = ({ queryModels, actions }) => {
            injectedModels = queryModels;
            injectedModel = queryModels.model;
            injectedActions = actions;
            return <div />;
        };
        const WrappedComponent = withQueryModels<{}>(TestComponentImpl);
        const queryConfigs = { model: { schemaQuery: MIXTURES_SCHEMA_QUERY } };
        const wrapper = mount(<WrappedComponent queryConfigs={queryConfigs} modelLoader={modelLoader} />);
        // When we first mount a component we initialize rows and queryInfo to undefined with loading states set to
        // loading.
        expect(injectedModel.queryInfo).toEqual(undefined);
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.INITIALIZED);
        expect(injectedModel.rows).toEqual(undefined);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.INITIALIZED);

        // Trigger load model like a consuming component would in componentDidMount.
        injectedActions.loadModel(injectedModel.id);
        // We can expect that LoadingState for QueryInfo should be LOADING, but rows shoudl still be INITIALIZED
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
        expect(injectedModel.error).toEqual(error);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        error = 'Error loading QueryInfo';
        modelLoader.queryInfoException = { exception: error };
        injectedActions.loadModel(injectedModel.id);
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADING);

        await sleep();

        // Expect resolveError to extract the error.
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADED);
        expect(injectedModel.error).toEqual(error);

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

        // Due to the async nature of this test we need to call done() to ensure the test does not fail due to timeout.
        done();
    });
});
