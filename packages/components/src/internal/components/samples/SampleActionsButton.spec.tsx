import React from 'react';
import { mount } from 'enzyme';
import { SampleActionsButton } from './SampleActionsButton';
import { TEST_USER_AUTHOR } from '../../../test/data/users';
import { QueryConfig, QueryModel } from '../../../public/QueryModel/QueryModel';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { PicklistCreationMenuItem } from '../picklist/PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from '../picklist/AddToPicklistMenuItem';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

describe('<SampleActionsButton/>', () => {
    test('Base menu options', () =>{
        const model = new QueryModel({
            schemaQuery: SchemaQuery.create('fakeSchema', 'fakeQuery')
        });

        const wrapper = mount(<SampleActionsButton user={TEST_USER_AUTHOR} model={model} moreMenuItems={undefined} />);
        expect(wrapper.find(PicklistCreationMenuItem)).toHaveLength(1);
        expect(wrapper.find(PicklistCreationMenuItem).prop('disabled')).toBeFalsy();
        expect(wrapper.find(AddToPicklistMenuItem)).toHaveLength(1);
        wrapper.unmount();
    });

    test('Active options', () => {
        let model = makeTestQueryModel(SchemaQuery.create('test', 'query'));
        model = model.mutate({ selections: new Set(['1', '2']) });

        const wrapper = mount(<SampleActionsButton user={TEST_USER_AUTHOR} model={model} moreMenuItems={undefined} />);
        expect(wrapper.find(PicklistCreationMenuItem)).toHaveLength(1);
        expect(wrapper.find(PicklistCreationMenuItem).prop('disabled')).toBeFalsy();
        expect(wrapper.find(AddToPicklistMenuItem)).toHaveLength(1);
        expect(wrapper.find(AddToPicklistMenuItem).prop('disabled')).toBeFalsy();
        wrapper.unmount();
    });
});
