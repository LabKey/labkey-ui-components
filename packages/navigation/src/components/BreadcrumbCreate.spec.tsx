import * as React from 'react'
import {Map, fromJS} from 'immutable'
import renderer from 'react-test-renderer'
import { mount } from 'enzyme'
import { AppURL } from "@glass/base";
import { BreadcrumbCreate } from "./BreadcrumbCreate";

const createdModifiedRow = Map<string, any>(fromJS({
   Created: {
      formattedValue: "2019-05-15 19:45",
      value: "2019-05-15 19:45:40.593"
   },
   CreatedBy: {
      displayValue: "username",
      url: "#/q/core/siteusers/1001",
      value: 1001
   },
   Modified: {
      formattedValue: "2019-05-16 19:45",
      value: "2019-05-16 19:45:40.593"
   },
   ModifiedBy: {
      displayValue: "username2",
      url: "#/q/core/siteusers/1002",
      value: 1002
   }
}));

describe("<BreadcrumbCreate/>", () => {

   test("with created row", () => {
      const component = (
          <BreadcrumbCreate row={createdModifiedRow}>
             <a href={AppURL.create('q').toString()}>First</a>
          </BreadcrumbCreate>
      );

      const wrapper = mount(component);
      expect(wrapper.find('li')).toHaveLength(1);
      expect(wrapper.find('span').text()).toContain('Modified ');
      const titleAttr = wrapper.find('span').getDOMNode().getAttribute('title');
      expect(titleAttr).toContain('Created by: username');
      expect(titleAttr).toContain('Modified by: username2');

      wrapper.unmount();
   });

   test("with multiple links, no created row", () => {
      const component = (
          <BreadcrumbCreate>
             <a href={AppURL.create('q').toString()}>First</a>
             <a href={AppURL.create('q', 'two').toString()}>Second</a>
             <a href={AppURL.create('q', 'two', 'three').toString()}>Third</a>
          </BreadcrumbCreate>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
   });

});