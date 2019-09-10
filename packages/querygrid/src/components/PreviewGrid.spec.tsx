import * as React from 'react';
import renderer from 'react-test-renderer'
import mock, { proxy } from "xhr-mock";
import { SchemaQuery } from '@glass/base';

import { initQueryGridState } from '../global';
import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../test/data/mixtures-getQuery.json';
import { PreviewGrid, } from './PreviewGrid';

beforeAll(() => {
    initQueryGridState();

    mock.setup();

    mock.get(/.*\/getQueryDetails.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(mixturesQueryInfo)
    });

    mock.post(/.*\/getQuery.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(mixturesQuery)
    });

    mock.use(proxy);
});

afterAll(() => {
    mock.reset();
});

const SQ = SchemaQuery.create('exp.data', 'mixtures', '~~default~~');

describe("PreviewGrid render", () => {
    test('PreviewGrid loading', done => {
        const component = (
            <PreviewGrid
                schemaQuery={SQ}
                numCols={4}
                numRows={3}
            />
        );

        const tree = renderer.create(component);
        // calling toMatchSnapshot() here without the setTimeout will check the render BEFORE the
        // selectRows/getQueryDetails resolve (https://www.leighhalliday.com/testing-asynchronous-components-mocks-jest)
        expect(tree.toJSON()).toMatchSnapshot();
        done();
    });

    test('PreviewGrid with data', done => {
        const component = (
            <PreviewGrid
                schemaQuery={SQ}
                numCols={4}
                numRows={3}
            />
        );

        const tree = renderer.create(component);
        // calling toMatchSnapshot() inside of setTimeout will check the render AFTER the
        // selectRows/getQueryDetails resolve (https://www.leighhalliday.com/testing-asynchronous-components-mocks-jest)
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test('PreviewGrid with different numCols and numRows', done => {
        const component = (
            <PreviewGrid
                schemaQuery={SQ}
                numCols={2}
                numRows={2}
            />
        );

        const tree = renderer.create(component);
        // calling toMatchSnapshot() inside of setTimeout will check the render AFTER the
        // selectRows/getQueryDetails resolve (https://www.leighhalliday.com/testing-asynchronous-components-mocks-jest)
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });
});
