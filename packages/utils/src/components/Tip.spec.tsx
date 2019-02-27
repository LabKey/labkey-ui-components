import * as React from 'react'
import { shallow } from "enzyme"
import { Tip } from "./Tip"
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

describe("<Tip />", () => {

   test("Render children", () => {
       const wrapper = shallow(<Tip caption="nothing important"><div>Here's my tip for you</div></Tip>);
       expect(wrapper.contains(<div>Here's my tip for you</div>)).toBe(true)
   });
});