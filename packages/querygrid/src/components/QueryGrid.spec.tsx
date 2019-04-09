import React from 'reactn';
import renderer from 'react-test-renderer';
import { QueryGridModel, SchemaQuery } from '@glass/base'

import { QueryGrid } from './QueryGrid'
import { initQueryGridState, updateQueryGridModel } from '../global'

beforeAll(() => {
    initQueryGridState()
});

// Mock all the actions to test just the rendering parts for QueryGrid itself
jest.mock('../actions');

describe("QueryGrid render", () => {
    test("loading", () => {

        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "q-snapshot"
        });
       const tree = renderer.create(<QueryGrid schemaQuery={schemaQuery}/>).toJSON();
       expect(tree).toMatchSnapshot();
    });

    test("query grid error", () => {
        const modelId = "queryGridError";
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "q-snapshot"
        });
        const model = new QueryGridModel({
            id: modelId,
            isLoaded: true,
            isLoading: false,
            isError: true,
            schema: schemaQuery.schemaName,
            query: schemaQuery.queryName,
        });
        updateQueryGridModel(model, {}, undefined, false);
        const tree = renderer.create(<QueryGrid model={model} schemaQuery={schemaQuery}/>);
        expect(tree).toMatchSnapshot();
    });

    test("allow selection", () => {
        const modelId = "gridWithSelection";
        const schemaQuery = new SchemaQuery({
            schemaName: "schema",
            queryName: "withSelection"
        });
        const model = new QueryGridModel({
            id: modelId,
            isLoaded: true,
            schema: schemaQuery.schemaName,
            query: schemaQuery.queryName,

        });
        // TODO make sure selection column shows up
        // TODO ??? click and verify state
    });

});