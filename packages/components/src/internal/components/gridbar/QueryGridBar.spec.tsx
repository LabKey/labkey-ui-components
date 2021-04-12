import React from 'react';
import renderer from 'react-test-renderer';
import { List, fromJS } from 'immutable';

import { SchemaQuery, QueryGridModel } from '../../..';
import { initUnitTestMocks } from '../../testHelperMocks';

import { QueryGridBar } from './QueryGridBar';

const SQ = new SchemaQuery({
    schemaName: 'assay.General.Amino Acids',
    queryName: 'Data',
});

const DATA = {
    1: { value: 1 },
    2: { value: 1 },
    3: { value: 1 },
    4: { value: 1 },
    5: { value: 1 },
    6: { value: 1 },
    7: { value: 1 },
    8: { value: 1 },
    9: { value: 1 },
    10: { value: 1 },
    11: { value: 1 },
    12: { value: 1 },
    13: { value: 1 },
    14: { value: 1 },
    15: { value: 1 },
    16: { value: 1 },
    17: { value: 1 },
    18: { value: 1 },
    19: { value: 1 },
    20: { value: 1 },
    21: { value: 1 },
    22: { value: 1 },
    23: { value: 1 },
    24: { value: 1 },
    25: { value: 1 },
    26: { value: 1 },
    27: { value: 1 },
    28: { value: 1 },
    29: { value: 1 },
    30: { value: 1 },
    31: { value: 1 },
    32: { value: 1 },
    33: { value: 1 },
    34: { value: 1 },
};

beforeAll(() => {
    initUnitTestMocks();
});

const DEFAULT_CONFIG = {
    schema: SQ.schemaName,
    query: SQ.queryName,
    isLoaded: true,
    isLoading: false,
    selectedLoaded: true,
    dataIds: List(Object.keys(DATA)),
    data: fromJS(DATA),
    totalRows: Object.keys(DATA).length,
};

describe('<QueryGridBar/>', () => {
    test('default props', () => {
        const model = new QueryGridModel({
            ...DEFAULT_CONFIG,
            id: 'QueryGridBarDefaultProps',
        });

        const tree = renderer.create(<QueryGridBar model={model} />);
        expect(tree).toMatchSnapshot();
    });

    test('without charts and views', () => {
        const model = new QueryGridModel({
            ...DEFAULT_CONFIG,
            id: 'QueryGridBarWithoutChartsViews',
            showChartSelector: false,
            showViewSelector: false,
        });

        const tree = renderer.create(<QueryGridBar model={model} />);
        expect(tree).toMatchSnapshot();
    });

    test('without omnibox', () => {
        const model = new QueryGridModel({
            ...DEFAULT_CONFIG,
            id: 'QueryGridBarWithoutOmnibox',
            showSearchBox: false,
        });

        const tree = renderer.create(<QueryGridBar model={model} />);
        expect(tree).toMatchSnapshot();
    });

    test('isPaged', () => {
        const model = new QueryGridModel({
            ...DEFAULT_CONFIG,
            id: 'QueryGridBarDefaultProps',
            isPaged: true,
        });

        const tree = renderer.create(<QueryGridBar model={model} />);
        expect(tree).toMatchSnapshot();
    });
});
