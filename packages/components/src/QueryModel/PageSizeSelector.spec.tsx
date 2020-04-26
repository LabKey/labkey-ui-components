import React from 'react';
import renderer from 'react-test-renderer';
import { mount, render } from 'enzyme';

import { Actions, LoadingState, QueryInfo, SchemaQuery } from '..';

import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';

import { QueryModel } from './QueryModel';
import { PageSizeSelector } from './PageSizeSelector';
import { initUnitTests, makeQueryInfo, makeTestActions } from './testUtils';

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO: QueryInfo;

beforeAll(() => {
    initUnitTests();
    // Have to instantiate QUERY_INFO here because it relies on initQueryGridState being called first.
    QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
});

describe('PageSizeSelector', () => {
    let model: QueryModel;
    let actions: Actions;
    beforeEach(() => {
        model = new QueryModel({ id: 'model', schemaQuery: SCHEMA_QUERY }).mutate({
            queryInfo: QUERY_INFO,
            queryInfoLoadingState: LoadingState.LOADED,
            rowCount: 661,
            rowsLoadingState: LoadingState.LOADED,
        });
        actions = makeTestActions();
    });

    test('pageSizes', () => {
        let tree = renderer.create(<PageSizeSelector model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();
        tree = renderer.create(<PageSizeSelector model={model} actions={actions} pageSizes={[1, 2, 3, 4, 5]} />);
        expect(tree.toJSON()).toMatchSnapshot();
        // We don't render the PageSizeSelector when we don't have enough rows for multiple pages.
        model = model.mutate({ rowCount: 5 });
        tree = renderer.create(<PageSizeSelector model={model} actions={actions} />);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('interactions', () => {
        const wrapper = mount(<PageSizeSelector model={model} actions={actions} />);
        wrapper.find('MenuItem').at(1).find('a').simulate('click');
        expect(actions.setMaxRows).toHaveBeenCalledWith('model', 20);
        wrapper.find('MenuItem').last().find('a').simulate('click');
        expect(actions.setMaxRows).toHaveBeenCalledWith('model', 400);
    });

    test('disabled', () => {
        const dropdownSelector = 'div.dropdown';
        let wrapper = render(<PageSizeSelector model={model} actions={actions} />);
        expect(wrapper.find(dropdownSelector)[0].attribs.class).not.toContain('disabled');
        model = model.mutate({ error: 'Oh no!' });
        wrapper = render(<PageSizeSelector model={model} actions={actions} />);
        expect(wrapper.find(dropdownSelector)[0].attribs.class).toContain('disabled');
        model = model.mutate({
            error: undefined,
            rowsLoadingState: LoadingState.LOADING,
        });
        wrapper = render(<PageSizeSelector model={model} actions={actions} />);
        expect(wrapper.find(dropdownSelector)[0].attribs.class).toContain('disabled');
    });
});
