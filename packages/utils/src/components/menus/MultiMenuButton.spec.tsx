import * as React from 'react'
import { List } from 'immutable'
import renderer from 'react-test-renderer'
import { shallow } from "enzyme";
import { MultiMenuButton } from "./MultiMenuButton";

const menuKeys = List<string>(["first", "second", "third"]);

describe("<MultiMenuButton />", () => {
    test("menu closed", () => {
        const tree = renderer.create(<MultiMenuButton menuKeys={menuKeys} renderMenuItem={(menuKey) => (menuKey)} title={"My Menu"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("menu open with current subMenu", () => {
        let menu = shallow(<MultiMenuButton
            menuKeys={menuKeys}
            currentSubMenuKey={"first"}
            renderMenuItem={(menuKey, menuChoice) => (menuKey + (menuChoice ? ":" + menuChoice : ""))}
            title={"Test Open Menu"}/>);
        menu.setState({opened: true});
        expect(menu).toMatchSnapshot();
    });

    test("menu open with current subMenu and choice", () => {
        let menu = shallow(<MultiMenuButton
            menuKeys={menuKeys}
            currentSubMenuKey={"first"}
            currentSubMenuChoice={"test first"}
            renderMenuItem={(menuKey, menuChoice) => (menuKey + (menuChoice ? ":" + menuChoice : ""))}
            title={"Test Open Menu with SubMenu choice"}/>);
        menu.setState({opened: true});
        expect(menu).toMatchSnapshot();
    })
});