import { fromJS } from 'immutable';
import React from 'react';
import renderer from 'react-test-renderer';

import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../../test/data/mixtures-getQuery.json';

import { makeQueryInfo, makeTestData, registerDefaultURLMappers } from '../test/testHelpers';

import { SchemaQuery } from '../../public/SchemaQuery';

import { StatelessPreviewGrid } from './PreviewGrid';

let QUERY_INFO;
let DATA;

beforeAll(() => {
    QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
    const { rows, orderedRows } = makeTestData(mixturesQuery);
    DATA = fromJS(orderedRows.map(id => rows[id]));
    LABKEY.container = {
        id: 'testContainerEntityId',
        title: 'Test Container',
        path: '/testContainer',
    };

    registerDefaultURLMappers();
});

const SQ = new SchemaQuery('exp.data', 'mixtures', '~~default~~');

describe('PreviewGrid render', () => {
    test('PreviewGrid loading', () => {
        const tree = renderer.create(
            <StatelessPreviewGrid
                schemaQuery={SQ}
                numCols={4}
                numRows={3}
                queryInfo={QUERY_INFO}
                loading={true}
                error={undefined}
                data={DATA}
            />
        );
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('PreviewGrid with data', () => {
        const tree = renderer.create(
            <StatelessPreviewGrid
                schemaQuery={SQ}
                numCols={4}
                numRows={3}
                queryInfo={QUERY_INFO}
                loading={false}
                error={undefined}
                data={DATA}
            />
        );
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('PreviewGrid with different numCols and numRows', () => {
        const tree = renderer.create(
            <StatelessPreviewGrid
                schemaQuery={SQ}
                numCols={2}
                numRows={2}
                queryInfo={QUERY_INFO}
                loading={false}
                error={undefined}
                data={DATA}
            />
        );
        expect(tree.toJSON()).toMatchSnapshot();
    });
});
