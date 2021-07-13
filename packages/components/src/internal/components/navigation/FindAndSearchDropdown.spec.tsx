import React from 'react';
import { FindAndSearchDropdown } from './FindAndSearchDropdown';
import { mount } from 'enzyme';
import { MenuItem } from 'react-bootstrap';

describe("FindAndSearchDropdown", () => {
   test("search but no find" , () => {
       const wrapper = mount(<FindAndSearchDropdown title={"Test title"} onSearch={jest.fn} />);
       expect(wrapper.find("DropdownToggle").text().trim()).toBe("Test title");
       const items = wrapper.find(MenuItem);
       expect(items).toHaveLength(1);
       expect(items.at(0).text().trim()).toBe("Search");
       expect(wrapper.find("Modal")).toHaveLength(0);
   });

   test("find but no search", () => {
       const wrapper = mount(<FindAndSearchDropdown title={"Test title"} findNounPlural={"tests"} onFindByIds={jest.fn} />);
       const items = wrapper.find(MenuItem);
       expect(items).toHaveLength(1);
       expect(items.at(0).text().trim()).toBe("Find Tests");
       expect(wrapper.find("Modal")).toHaveLength(2);
   });
});
