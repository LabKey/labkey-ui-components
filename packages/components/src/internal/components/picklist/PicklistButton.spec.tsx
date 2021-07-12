import React from 'react';
import { mount } from 'enzyme';
import { PicklistButton } from './PicklistButton';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { TEST_USER_EDITOR } from '../../../test/data/users';

describe("PicklistButton", () => {
   test("with model no selections", () => {
       const queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));

       const wrapper = mount(<PicklistButton model={queryModel} user={TEST_USER_EDITOR}/>);
       expect(wrapper.find("MenuItem")).toHaveLength(2);
   });

   test("with model and selections", () => {
       let queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));
       queryModel = queryModel.mutate({ selections: new Set(['1', '2']) });
       const wrapper = mount(<PicklistButton model={queryModel} user={TEST_USER_EDITOR}/>);
       expect(wrapper.find("MenuItem")).toHaveLength(2);
   });

   test('no model', () => {
       const wrapper = mount(<PicklistButton model={undefined} user={TEST_USER_EDITOR}/>);
       expect(wrapper.find("MenuItem")).toHaveLength(2);
   });
});
