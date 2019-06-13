import * as React from 'react'
import renderer from 'react-test-renderer'
import { mount } from 'enzyme'
import { AppURL } from "@glass/base";

import { Breadcrumb } from "./Breadcrumb";

describe("<Breadcrumb/>", () => {

   test("with one link", () => {
      const component = (
          <Breadcrumb>
             <a href={AppURL.create('q').toString()}>First</a>
          </Breadcrumb>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
   });

   test("with multiple links", () => {
      const component = (
          <Breadcrumb>
             <a href={AppURL.create('q').toString()}>First</a>
             <a href={AppURL.create('q', 'two').toString()}>Second</a>
             <a href={AppURL.create('q', 'two', 'three').toString()}>Third</a>
          </Breadcrumb>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
   });

   test("with className prop", () => {
      const component = (
          <Breadcrumb className={'anotherclass'}/>
      );

      const wrapper = mount(component);
      expect(wrapper.find('ol').getDOMNode().getAttribute('class')).toBe('breadcrumb anotherclass');
      wrapper.unmount();
   });

});