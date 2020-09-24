import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { QueryInfo, SchemaQuery } from '../..';

import { initUnitTests, makeQueryInfo } from '../../internal/testHelpers';

import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';

import { ViewMenu } from './ViewMenu';
import { makeTestQueryModel } from './testUtils';

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO_NO_VIEWS: QueryInfo;
let QUERY_INFO_PUBLIC_VIEWS: QueryInfo;
let QUERY_INFO_PRIVATE_VIEWS: QueryInfo;

beforeAll(() => {
    initUnitTests();
    // Have to instantiate QueryInfos here because applyQueryMetadata relies on initQueryGridState being called first.
    QUERY_INFO_NO_VIEWS = makeQueryInfo({
        ...mixturesQueryInfo,
        views: [],
    });
    QUERY_INFO_PUBLIC_VIEWS = makeQueryInfo(mixturesQueryInfo);
    QUERY_INFO_PRIVATE_VIEWS = makeQueryInfo({
        ...mixturesQueryInfo,
        views: [
            mixturesQueryInfo.views[0],
            {
                ...mixturesQueryInfo.views[1],
                shared: false,
            },
        ],
    });
});

describe('ViewMenu', () => {
    test('Render', () => {
        // Renders nothing
        let model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_NO_VIEWS, {}, []);
        let tree = renderer.create(<ViewMenu hideEmptyViewMenu model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Renders empty view selector with disabled dropdown.
        tree = renderer.create(<ViewMenu hideEmptyViewMenu={false} model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // No Extra columns shows up under "All Saved Views"
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PUBLIC_VIEWS, {}, []);
        tree = renderer.create(<ViewMenu hideEmptyViewMenu={true} model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // No Extra columns shows up under "My Saved Views"
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PRIVATE_VIEWS, {}, []);
        tree = renderer.create(<ViewMenu hideEmptyViewMenu={true} model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Same as previous, but the No Extra Column view is set to active.
        model = model.mutate({
            schemaQuery: SchemaQuery.create(SCHEMA_QUERY.schemaName, SCHEMA_QUERY.queryName, 'noExtraColumn'),
        });
        tree = renderer.create(<ViewMenu hideEmptyViewMenu={true} model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('Interactivity', () => {
        const onViewSelect = jest.fn();
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PUBLIC_VIEWS, {}, []);
        const wrapper = mount(<ViewMenu hideEmptyViewMenu={true} model={model} onViewSelect={onViewSelect} />);
        wrapper.find('MenuItem').last().find('a').simulate('click');
        expect(onViewSelect).toHaveBeenCalledWith('noMixtures');
    });
});
