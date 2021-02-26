import React from 'react';
import renderer from 'react-test-renderer';

import { SchemaQuery, getStateQueryGridModel, gridInit, getQueryGridModel } from '../../..';
import { sleep } from '../../testHelpers';
import { initUnitTestMocks } from '../../testHelperMocks';

import { QueryGridBar } from './QueryGridBar';

const SQ = new SchemaQuery({
    schemaName: 'assay.General.Amino Acids',
    queryName: 'Data',
});

beforeAll(() => {
    initUnitTestMocks();
});

describe('<QueryGridBar/>', () => {
    test('default props', async () => {
        const model = getStateQueryGridModel('QueryGridBarDefaultProps', SQ);
        gridInit(model);

        await sleep();

        const tree = renderer.create(<QueryGridBar model={getQueryGridModel(model.getId())} />);
        expect(tree).toMatchSnapshot();
    });

    test('without charts and views', async () => {
        const model = getStateQueryGridModel('QueryGridBarWithoutChartsViews', SQ, {
            showChartSelector: false,
            showViewSelector: false,
        });
        gridInit(model);

        await sleep();

        const tree = renderer.create(<QueryGridBar model={getQueryGridModel(model.getId())} />);
        expect(tree).toMatchSnapshot();
    });

    test('without omnibox', async () => {
        const model = getStateQueryGridModel('QueryGridBarWithoutOmnibox', SQ, {
            showSearchBox: false,
        });
        gridInit(model);

        await sleep();

        const tree = renderer.create(<QueryGridBar model={getQueryGridModel(model.getId())} />);
        expect(tree).toMatchSnapshot();
    });

    test('isPaged', async () => {
        const model = getStateQueryGridModel('QueryGridBarIsPaged', SQ, {
            isPaged: true,
        });
        gridInit(model);

        await sleep();

        const tree = renderer.create(<QueryGridBar model={getQueryGridModel(model.getId())} />);
        expect(tree).toMatchSnapshot();
    });
});
