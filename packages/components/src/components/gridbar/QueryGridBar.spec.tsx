import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { SchemaQuery } from '../base/models/model';
import { initUnitTestMocks } from '../../testHelpers';
import { getStateQueryGridModel } from '../../models';
import { gridInit } from '../../actions';
import { getQueryGridModel } from '../../global';

import { QueryGridBar } from './QueryGridBar';

const SQ = new SchemaQuery({
    schemaName: 'assay.General.Amino Acids',
    queryName: 'Data',
});

beforeAll(() => {
    initUnitTestMocks();
});

describe('<QueryGridBar/>', () => {
    test('default props', done => {
        const model = getStateQueryGridModel('QueryGridBarDefaultProps', SQ);
        gridInit(model);

        window.setTimeout(() => {
            const component = <QueryGridBar model={getQueryGridModel(model.getId())} />;
            const tree = renderer.create(component);
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test('without charts and views', done => {
        const model = getStateQueryGridModel('QueryGridBarWithoutChartsViews', SQ, {
            showChartSelector: false,
            showViewSelector: false,
        });
        gridInit(model);

        window.setTimeout(() => {
            const component = <QueryGridBar model={getQueryGridModel(model.getId())} />;
            const tree = renderer.create(component);
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test('without omnibox', done => {
        const model = getStateQueryGridModel('QueryGridBarWithoutOmnibox', SQ, {
            showSearchBox: false,
        });
        gridInit(model);

        window.setTimeout(() => {
            const component = <QueryGridBar model={getQueryGridModel(model.getId())} />;
            const tree = renderer.create(component);
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });

    test('isPaged', done => {
        const model = getStateQueryGridModel('QueryGridBarIsPaged', SQ, {
            isPaged: true,
        });
        gridInit(model);

        window.setTimeout(() => {
            const component = <QueryGridBar model={getQueryGridModel(model.getId())} />;
            const tree = renderer.create(component);
            expect(tree.toJSON()).toMatchSnapshot();
            done();
        });
    });
});
