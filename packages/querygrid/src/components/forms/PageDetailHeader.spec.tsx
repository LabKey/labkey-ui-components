import * as React from 'react'
import renderer from 'react-test-renderer'
import { mount } from 'enzyme'

import { PageDetailHeader } from "./PageDetailHeader";
import { User } from "@glass/base";

describe("<PageDetailHeader/>", () => {

   test("default props", () => {
      const component = (
          <PageDetailHeader title={'Title'} user={new User()}/>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
   });

   test("with additional props", () => {
      const component = (
          <PageDetailHeader
              user={new User()}
              title={'Title'}
              subTitle={'Subtitle'}
              description={'Description'}
              iconDir={'iconDir'}
              iconSrc={'iconSrc'}
              leftColumns={5}
          >
             <div>Someting off to the right</div>
          </PageDetailHeader>
      );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
   });

   test("prefer iconUrl", () => {
      const component = (
          <PageDetailHeader
              user={new User()}
              title={'Title'}
              iconUrl={'iconUrl'}
              iconDir={'iconDir'}
              iconSrc={'iconSrc'}
          />
      );

      const wrapper = mount(component);
      const srcAttr = wrapper.find('img').getDOMNode().getAttribute('src');
      expect(srcAttr).toBe('iconUrl');
      wrapper.unmount();
   });

});