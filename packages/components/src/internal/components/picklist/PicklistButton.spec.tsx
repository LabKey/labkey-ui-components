import React from 'react';
import { mount } from 'enzyme';
import { PicklistButton } from './PicklistButton';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { TEST_USER_EDITOR } from '../../../test/data/users';
import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';

describe("PicklistButton", () => {
   test("with model no selections", () => {
       const queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));
       const featureArea = "featureArea";
       const wrapper = mount(<PicklistButton model={queryModel} user={TEST_USER_EDITOR} metricFeatureArea={featureArea}/>);
       const menuItem = wrapper.find(PicklistCreationMenuItem);
       expect(menuItem).toHaveLength(1);
       expect(menuItem.prop("selectionKey")).toBe(queryModel.id);
       expect(menuItem.prop("selectedQuantity")).toBeFalsy();
       expect(menuItem.prop("metricFeatureArea")).toBe(featureArea);
       const addMenuItem = wrapper.find(AddToPicklistMenuItem);
       expect(addMenuItem).toHaveLength(1);
       expect(addMenuItem.prop("metricFeatureArea")).toBe(featureArea);
   });

   test("with model and selections", () => {
       let queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));
       queryModel = queryModel.mutate({ selections: new Set(['1', '2']) });
       const wrapper = mount(<PicklistButton model={queryModel} user={TEST_USER_EDITOR}/>);
       const menuItem = wrapper.find(PicklistCreationMenuItem);
       expect(menuItem).toHaveLength(1);
       expect(menuItem.prop("selectionKey")).toBe(queryModel.id);
       expect(menuItem.prop("selectedQuantity")).toBe(2);
   });

   test('no model', () => {
       const wrapper = mount(<PicklistButton model={undefined} user={TEST_USER_EDITOR}/>);
       expect(wrapper.find("MenuItem")).toHaveLength(2);
       const menuItem = wrapper.find(PicklistCreationMenuItem);
       expect(menuItem).toHaveLength(1);
       expect(menuItem.prop("selectionKey")).toBeFalsy();
       expect(menuItem.prop("selectedQuantity")).toBeFalsy();
   });

});
