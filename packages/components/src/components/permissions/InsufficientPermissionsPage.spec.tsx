import * as React from 'react'
import renderer from 'react-test-renderer'
import { InsufficientPermissionsPage } from "./InsufficientPermissionsPage";

describe("<PermissionsPanel/>", () => {

   test("default properties", () => {
      const component = (
          <InsufficientPermissionsPage
              title={'Test Page Title'}
          />
       );

      const tree = renderer.create(component).toJSON();
      expect(tree).toMatchSnapshot();
   });

});