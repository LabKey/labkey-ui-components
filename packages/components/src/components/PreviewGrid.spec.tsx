import React from 'react';
import renderer from 'react-test-renderer';

import { initUnitTestMocks } from '../testHelpers';

import { PreviewGrid } from './PreviewGrid';
import { SchemaQuery } from './base/models/model';

beforeAll(() => {
    initUnitTestMocks();
});

const SQ = SchemaQuery.create('exp.data', 'mixtures', '~~default~~');

describe('PreviewGrid render', () => {
    test('PreviewGrid loading', done => {
        const tree = renderer.create(<PreviewGrid schemaQuery={SQ} numCols={4} numRows={3} />);
        // calling toMatchSnapshot() here without the setTimeout will check the render BEFORE the
        // selectRows/getQueryDetails resolve (https://www.leighhalliday.com/testing-asynchronous-components-mocks-jest)
        expect(tree.toJSON()).toMatchSnapshot();
        done();
    });

    test('PreviewGrid with data', done => {
        const tree = renderer.create(<PreviewGrid schemaQuery={SQ} numCols={4} numRows={3} />);
        // calling toMatchSnapshot() inside of setTimeout will check the render AFTER the
        // selectRows/getQueryDetails resolve (https://www.leighhalliday.com/testing-asynchronous-components-mocks-jest)
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test('PreviewGrid with different numCols and numRows', done => {
        const tree = renderer.create(<PreviewGrid schemaQuery={SQ} numCols={2} numRows={2} />);
        // calling toMatchSnapshot() inside of setTimeout will check the render AFTER the
        // selectRows/getQueryDetails resolve (https://www.leighhalliday.com/testing-asynchronous-components-mocks-jest)
        setTimeout(() => {
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });
});
