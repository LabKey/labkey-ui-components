import React, { PureComponent } from 'react';
import { Actions, QueryModel, SchemaQuery, withQueryModels } from '..';
import { initUnitTests, makeQueryInfo, makeTestData, sleep } from './testUtils';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../test/data/mixtures-getQueryPaging.json';
import { mount } from 'enzyme';
import { LoadingState } from './QueryModel';
import { MockQueryModelLoader } from '../test/MockQueryModelLoader';

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO;
let DATA;

beforeAll(() => {
    initUnitTests();
    QUERY_INFO = makeQueryInfo(mixturesQueryInfo);

    // Return so tests don't start till after the promise resolves, so we can guarantee DATA is initialized in tests.
    return makeTestData(mixturesQuery).then(data => {
        DATA = data;
    });
});

describe('withQueryModels', () => {
    test('actions', async (done) => {
        let modelLoader = new MockQueryModelLoader(QUERY_INFO, DATA);
        let injectedModel: QueryModel;
        let injectedActions: Actions;
        const TestComponentImpl = ({ queryModels, actions }) => {
            injectedModel = queryModels.model;
            injectedActions = actions;
            return <div />;
        };
        const WrappedComponent = withQueryModels<{}>(TestComponentImpl);
        const queryConfigs = { model: { schemaQuery: SCHEMA_QUERY } };
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

        /**
         * TODO:
         *  - next page
         *  - prev page
         *  - first page
         *  - last page
         *  - change schema query
         *  - change view
         *  - set max rows
         *  - add another model.
         */
        done();
    });
});
