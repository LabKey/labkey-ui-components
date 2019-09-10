import * as React from 'react';
import { shallow } from 'enzyme';
import { fromJS, List } from 'immutable';
import { initQueryGridState } from '../global';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../test/data/mixtures-getQuery.json';
import { SchemaQuery, resolveSchemaQuery } from '@glass/base';
import { applyQueryMetadata, handle132Response } from '../query/api';
import { StatelessPreviewGrid } from './PreviewGrid';

beforeAll(() => {
    initQueryGridState();
});

describe("PreviewGrid render", () => {
    test('PreviewGrid loading', () => {
        const sq = SchemaQuery.create('exp.data', 'mixtures', '~~default~~');

        const mounted = shallow((
            <StatelessPreviewGrid
                schemaQuery={sq}
                numCols={4}
                numRows={3}
                queryInfo={null}
                data={null}
                loading={true}
                error={null}
            />
        ));
        expect(mounted.html()).toMatchSnapshot();
    });

    test('PreviewGrid with data', () => {
        // Note: this test has to fake up what a response looks like by using some of the internals of api.ts because
        // xhr-mock (or something else???) cannot handle nested promises that make API requests. We can't test the
        // "smart" PreviewGrid component, instead we have to test the StatelessPreviewGrid, because it has a nested
        // call of selectRows inside a call to getQueryDetails.
        const sq = SchemaQuery.create('exp.data', 'mixtures', '~~default~~');
        const key = resolveSchemaQuery(sq);
        const queryInfo = applyQueryMetadata(mixturesQueryInfo);
        handle132Response(mixturesQuery).then((response)=> {
            // TODO: Make it so handle132Response is NOT a promise. If any of the code in this .then block throws an
            //  error and we don't catch it, the test will pass. https://media.giphy.com/media/111ebonMs90YLu/giphy.gif
            const {models, orderedModels} = response;

            // FIXME: Why do I need to do this transformation here? For some reason this is done by selectRows (or
            //  something else) when we're running StoryBook. There are errors in the console ("Mising entry RowId")
            //  indicating that handle132Response does not like the mixturesQuery data.
            const rowsWithoutDataAttr = Object.keys(models[key]).reduce((result, rowId) => {
                return {
                    ...result,
                    [rowId]: {...models[key][rowId].data},
                };
            }, {});

            // Stolen from PreviewGrid selectRows.then()
            const rows = fromJS(rowsWithoutDataAttr);
            const data = List(orderedModels[key]).map((id) => rows.get(id)).toList();
            const mounted = shallow((
                <StatelessPreviewGrid
                    schemaQuery={sq}
                    numCols={4}
                    numRows={3}
                    queryInfo={queryInfo}
                    data={data}
                    loading={false}
                    error={null}
                />
            ));
            expect(mounted.html()).toMatchSnapshot();
        });
    });
});
