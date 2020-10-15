import React from 'react';
import renderer from 'react-test-renderer';

import { initUnitTestMocks, registerDefaultURLMappers, sleep } from '../testHelpers';

import { SchemaQuery } from '../..';

import { PreviewGrid } from './PreviewGrid';

beforeAll(() => {
    initUnitTestMocks();
    registerDefaultURLMappers();
});

const SQ = SchemaQuery.create('exp.data', 'mixtures', '~~default~~');

describe('PreviewGrid render', () => {
    test('PreviewGrid loading', () => {
        const tree = renderer.create(<PreviewGrid schemaQuery={SQ} numCols={4} numRows={3} />);
        // calling toMatchSnapshot() here without sleep will check the render BEFORE the
        // selectRows/getQueryDetails resolve (https://www.leighhalliday.com/testing-asynchronous-components-mocks-jest)
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('PreviewGrid with data', async () => {
        const tree = renderer.create(<PreviewGrid schemaQuery={SQ} numCols={4} numRows={3} />);
        // calling toMatchSnapshot() after sleep will check the render AFTER the
        // selectRows/getQueryDetails resolve (https://www.leighhalliday.com/testing-asynchronous-components-mocks-jest)
        await sleep();
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('PreviewGrid with different numCols and numRows', async () => {
        const tree = renderer.create(<PreviewGrid schemaQuery={SQ} numCols={2} numRows={2} />);
        // calling toMatchSnapshot() after sleep will check the render AFTER the
        // selectRows/getQueryDetails resolve (https://www.leighhalliday.com/testing-asynchronous-components-mocks-jest)
        await sleep();
        expect(tree.toJSON()).toMatchSnapshot();
    });
});
