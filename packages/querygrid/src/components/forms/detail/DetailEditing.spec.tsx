import * as React from 'react'
import renderer from 'react-test-renderer'
import { mount } from 'enzyme'
import mock, { proxy } from "xhr-mock";
import { fromJS } from 'immutable';
import { SchemaQuery, SCHEMAS } from "@glass/base";

import { DetailEditing } from "./DetailEditing";
import { getStateQueryGridModel } from "../../../model";
import { getQueryGridModel, initQueryGridState } from "../../../global";
import { gridInit } from "../../..";

import sampleSetQueryInfo from '../../../test/data/samplesSet-getQueryDetails.json';
import sampleDetailsQuery from '../../../test/data/sampleDetails-getQuery.json';

let MODEL_ID;

beforeAll(() => {
   LABKEY.container = {
      path: '/testContainer' // just needs to be something so initMocks regexs will match
   };

   initQueryGridState(fromJS({
      schema: {
         [SCHEMAS.SAMPLE_SETS.SCHEMA]: {
            queryDefaults: {
               appEditableTable: true
            }
         }
      }
   }));

   mock.setup();
   mock.get(/.*\/query\/.*\/getQueryDetails.*/, (req, res) => {
      return res
          .status(200)
          .headers({'Content-Type': 'application/json'})
          .body(JSON.stringify(sampleSetQueryInfo));
   });
   mock.use(proxy);

   const model = getStateQueryGridModel('jest-querygridmodel', SchemaQuery.create('samples', 'Samples'), {
      allowSelection: false,
      loader: {
         fetch: () => {
            const data = fromJS(sampleDetailsQuery.rows[0]);

            return new Promise((resolve) => {
               resolve({
                  data: data,
                  dataIds: data.keySeq().toList(),
               });
            });
         }
      }
   });
   gridInit(model);

   MODEL_ID = model.getId();
});

const editBtnSelector = '.detail__edit-button';
const headingSelector = '.detail__edit--heading';

describe("<DetailEditing/>", () => {

   test("loading", () => {
      const model = getStateQueryGridModel('jest-querygridmodel-loading', SchemaQuery.create('samples', 'Samples'));
      const component = (
          <DetailEditing queryModel={model} canUpdate={true}/>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
   });

   test("canUpdate false", () => {
      const model = getQueryGridModel(MODEL_ID);
      const component = (
          <DetailEditing queryModel={model} canUpdate={false}/>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();

      const wrapper = mount(component);
      expect(wrapper.find(editBtnSelector)).toHaveLength(0);
      wrapper.unmount();
   });

   test("canUpdate true", () => {
      const model = getQueryGridModel(MODEL_ID);
      const component = (
          <DetailEditing queryModel={model} canUpdate={true}/>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();

      const wrapper = mount(component);
      expect(wrapper.find(headingSelector).text()).toBe('Details');

      // find edit button and click it to make sure form renders
      const editButton = wrapper.find(editBtnSelector);
      expect(editButton).toHaveLength(1);
      expect(editButton.find('i')).toHaveLength(1);
      editButton.hostNodes().simulate('click');
      expect(wrapper.find(headingSelector).text()).toBe('Editing Details');
      expect(wrapper.find('.form-group')).toHaveLength(4);

      // find the save button and click it
      expect(wrapper.find('.edit__warning')).toHaveLength(0);
      const saveButton = wrapper.find('.btn-primary');
      expect(saveButton).toHaveLength(2);
      saveButton.first().hostNodes().simulate('click');
      // expect(wrapper.find('.edit__warning')).toHaveLength(1);

      wrapper.unmount();
   });

   test("useEditIcon false", () => {
      const model = getQueryGridModel(MODEL_ID);
      const component = (
          <DetailEditing queryModel={model} canUpdate={true} useEditIcon={false}/>
      );

      const wrapper = mount(component);
      // find edit button and make sure it isn't an icon
      const editButton = wrapper.find(editBtnSelector);
      expect(editButton.find('i')).toHaveLength(0);
      expect(editButton.text()).toBe('Edit');
      wrapper.unmount();
   });

});