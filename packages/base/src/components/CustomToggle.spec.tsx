import * as React from 'react'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'

import { CustomToggle } from './CustomToggle'

describe("<CustomToggle />", () => {
   test("render children", () => {
      const tree = renderer.create(<CustomToggle><div className="a1">One child</div></CustomToggle>).toJSON();
      expect(tree).toMatchSnapshot();
   });

   test("with onClick", () => {
      const onButtonClick = jest.fn();
      const wrapper = shallow(<CustomToggle onClick={onButtonClick}/>);
      wrapper.find("span").simulate('click', {preventDefault: () => {}});
      expect(onButtonClick).toHaveBeenCalledTimes(1);
   })
});