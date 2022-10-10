import React from 'react';
import { mount } from 'enzyme';

import { TEST_USER_AUTHOR } from '../internal/userFixtures';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { SchemaQuery } from '../public/SchemaQuery';
import { PicklistCreationMenuItem } from '../internal/components/picklist/PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from '../internal/components/picklist/AddToPicklistMenuItem';
import { makeTestQueryModel } from '../public/QueryModel/testUtils';

import { SampleActionsButton } from './SampleActionsButton';

describe('SampleActionsButton', () => {
    test('Base menu options', () => {
        const model = new QueryModel({
            schemaQuery: SchemaQuery.create('fakeSchema', 'fakeQuery'),
        });

        const wrapper = mount(<SampleActionsButton user={TEST_USER_AUTHOR} model={model} />);
        expect(wrapper.find(PicklistCreationMenuItem)).toHaveLength(1);
        expect(wrapper.find(AddToPicklistMenuItem)).toHaveLength(1);
        wrapper.unmount();
    });
});
