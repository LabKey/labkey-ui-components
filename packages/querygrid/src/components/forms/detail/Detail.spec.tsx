import * as React from 'react'
import renderer from 'react-test-renderer'
import { mount } from 'enzyme'
import mock, { proxy } from "xhr-mock";
import { fromJS } from 'immutable';
import { SchemaQuery } from "@glass/base";

import { Detail } from "./Detail";
import { getStateQueryGridModel } from "../../../models";
import { getQueryGridModel, initQueryGridState } from "../../../global";
import { gridInit } from "../../..";

import sampleSetQueryInfo from '../../../test/data/samplesSet-getQueryDetails.json';
import sampleDetailsQuery from '../../../test/data/sampleDetails-getQuery.json';

let MODEL_ID;

beforeAll(() => {
   LABKEY.container = {
      path: '/testContainer' // just needs to be something so initMocks regexs will match
   };

   initQueryGridState();

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

describe("<Detail/>", () => {

   test("loading", () => {
      const component = (
          <Detail/>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
   });

   test("with QueryGridModel", () => {
      const model = getQueryGridModel(MODEL_ID);
      const component = (
          <Detail queryModel={model}/>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();

      const wrapper = mount(component);
      // expect one table row for each display column
      expect(wrapper.find('tr')).toHaveLength(model.getDisplayColumns().size);
      // expect two of the field values to render as links (Name, Lookupfield)
      expect(wrapper.find('a')).toHaveLength(2);
      // expect the row labels to be the column captions by default
      expect(wrapper.find('table').text().indexOf('Lookup Field Caption')).toBeGreaterThan(-1);
      wrapper.unmount();
   });

   test("asPanel", () => {
      const model = getQueryGridModel(MODEL_ID);
      const component = (
          <Detail asPanel={true} queryModel={model}/>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
   });

   test("titleRenderer", () => {
      const model = getQueryGridModel(MODEL_ID);
      const component = (
          <Detail queryModel={model} titleRenderer={(val) => val.fieldKey}/>
      );

      const wrapper = mount(component);
      // expect custom titleRenderer to use the column's fieldKey instead of caption
      expect(wrapper.find('table').text().indexOf('lookupfield')).toBeGreaterThan(-1);
      wrapper.unmount();
   });

   test("detailRenderer", () => {
      const model = getQueryGridModel(MODEL_ID);
      const component = (
          <Detail queryModel={model} detailRenderer={() => {
             return () => {return <h1>TESTING</h1>};
          }}/>
      );

      const wrapper = mount(component);
      expect(wrapper.find('a')).toHaveLength(0);
      expect(wrapper.find('h1')).toHaveLength(model.getDisplayColumns().size);
      wrapper.unmount();
   });

});