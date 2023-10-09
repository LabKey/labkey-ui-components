import React from 'react';
import { DropdownButton } from 'react-bootstrap';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { TEST_USER_EDITOR } from '../../userFixtures';

import { mountWithServerContext } from '../../test/enzymeTestHelpers';

import { SubMenuItem } from '../menus/SubMenuItem';

import { PicklistButton } from './PicklistButton';
import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';

describe('PicklistButton', () => {
    test('with model no selections', () => {
        const queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));
        const featureArea = 'featureArea';
        const wrapper = mountWithServerContext(
            <PicklistButton model={queryModel} user={TEST_USER_EDITOR} metricFeatureArea={featureArea} />,
            { user: TEST_USER_EDITOR }
        );
        expect(wrapper.find(DropdownButton)).toHaveLength(1);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        const menuItem = wrapper.find(PicklistCreationMenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.prop('metricFeatureArea')).toBe(featureArea);
        const addMenuItem = wrapper.find(AddToPicklistMenuItem);
        expect(addMenuItem).toHaveLength(1);
        expect(addMenuItem.prop('metricFeatureArea')).toBe(featureArea);
    });

    test('asSubMenu', () => {
        const queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));
        const featureArea = 'featureArea';
        const wrapper = mountWithServerContext(
            <PicklistButton model={queryModel} user={TEST_USER_EDITOR} metricFeatureArea={featureArea} asSubMenu />,
            { user: TEST_USER_EDITOR }
        );
        expect(wrapper.find(DropdownButton)).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(1);
    });

    test('with model and selections', () => {
        let queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));
        queryModel = queryModel.mutate({ selections: new Set(['1', '2']) });
        const wrapper = mountWithServerContext(<PicklistButton model={queryModel} user={TEST_USER_EDITOR} />, {
            user: TEST_USER_EDITOR,
        });
        const menuItem = wrapper.find(PicklistCreationMenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.prop('queryModel')).toBeDefined();
    });
});
