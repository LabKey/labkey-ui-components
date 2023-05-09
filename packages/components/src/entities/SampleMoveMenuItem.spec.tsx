import React from 'react';

import { ReactWrapper } from 'enzyme';

import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';
import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';

import { mountWithAppServerContext } from '../internal/testHelpers';

import { EntityMoveModal } from '../internal/components/entities/EntityMoveModal';

import { QueryInfo } from '../public/QueryInfo';

import { EntityMoveMenuItem } from './EntityMoveMenuItem';

describe('SampleMoveMenuItem', () => {
    const ACTIONS = makeTestActions();

    function validate(wrapper: ReactWrapper, moveModalCount = 0) {
        const menuItem = wrapper.find(SelectionMenuItem);

        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe('Move to Project');

        const menuItemComp = wrapper.find('MenuItem a');
        menuItemComp.simulate('click');

        const modal = wrapper.find(EntityMoveModal);
        expect(modal).toHaveLength(moveModalCount);
    }

    test('click menu item with no selection', () => {
        const queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));
        const wrapper = mountWithAppServerContext(<EntityMoveMenuItem actions={ACTIONS} queryModel={queryModel} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('click menu item', () => {
        let queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));
        queryModel = queryModel.mutate({ rowCount: 2, selections: new Set(['1', '2']) });
        const wrapper = mountWithAppServerContext(<EntityMoveMenuItem actions={ACTIONS} queryModel={queryModel} />);
        validate(wrapper, 1);
        expect(wrapper.find(EntityMoveModal).prop('targetAppURL').toHref()).toBe('#/samples/query');
        wrapper.unmount();
    });

    test('isMedia', () => {
        let queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'), new QueryInfo({ isMedia: true }));
        queryModel = queryModel.mutate({ rowCount: 2, selections: new Set(['1', '2']) });
        const wrapper = mountWithAppServerContext(<EntityMoveMenuItem actions={ACTIONS} queryModel={queryModel} />);
        validate(wrapper, 1);
        expect(wrapper.find(EntityMoveModal).prop('targetAppURL').toHref()).toBe('#/media/query');
        wrapper.unmount();
    });
});
