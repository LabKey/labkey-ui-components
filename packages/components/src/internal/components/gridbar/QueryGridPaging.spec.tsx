import React from 'react';
import renderer from 'react-test-renderer';

import { QueryGridModel } from '../../..';

import { QueryGridPaging } from './QueryGridPaging';

describe('<QueryGridPaging/>', () => {
    test('not isPaged', () => {
        const model = new QueryGridModel({
            isPaged: false,
            pageNumber: 1,
            maxRows: 20,
            totalRows: 50,
        });
        const component = <QueryGridPaging model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('first page', () => {
        const model = new QueryGridModel({
            isPaged: true,
            pageNumber: 1,
            maxRows: 20,
            totalRows: 50,
        });
        const component = <QueryGridPaging model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('not showCounts', () => {
        const model = new QueryGridModel({
            isPaged: true,
            pageNumber: 1,
            maxRows: 20,
            totalRows: 50,
        });
        const component = <QueryGridPaging model={model} showCounts={false} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('middle page', () => {
        const model = new QueryGridModel({
            isPaged: true,
            pageNumber: 2,
            maxRows: 20,
            totalRows: 50,
        });
        const component = <QueryGridPaging model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('last page', () => {
        const model = new QueryGridModel({
            isPaged: true,
            pageNumber: 3,
            maxRows: 20,
            totalRows: 50,
        });
        const component = <QueryGridPaging model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('pageNumber past max', () => {
        const model = new QueryGridModel({
            isPaged: true,
            pageNumber: 4,
            maxRows: 20,
            totalRows: 50,
        });
        const component = <QueryGridPaging model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('pageSize equals total rows', () => {
        const model = new QueryGridModel({
            isPaged: true,
            pageNumber: 1,
            maxRows: 50,
            totalRows: 50,
        });
        const component = <QueryGridPaging model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('zero totalRows', () => {
        const model = new QueryGridModel({
            isPaged: true,
            pageNumber: 1,
            maxRows: 20,
            totalRows: 0,
        });
        const component = <QueryGridPaging model={model} />;

        const tree = renderer.create(component);
        expect(tree.toJSON()).toMatchSnapshot();
    });
});
