import * as React from 'react'
import { List } from 'immutable'
import renderer from 'react-test-renderer'

import { MenuOption, SubMenu } from './SubMenu'

describe("<SubMenu />", () => {
    test("no options", () => {
        const tree = renderer.create(<SubMenu currentMenuChoice={"option 1"} options={List<MenuOption>()} text={"Test with no options"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("with options but none chosen", () => {
        const tree = renderer.create(<SubMenu
            currentMenuChoice={undefined}
            options={List<MenuOption>([
                {
                    href: "go/to/option1",
                    key: "option1",
                    name: "first option"
                },
                {
                    href: "go/to/option2",
                    key: "option2",
                    name: "second option"
                },
                {
                    href: "go/to/option3",
                    key: "option3",
                    name: "third option"
                }
            ])}
            text={"Test with options not chosen"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("two options, one chosen", () => {
        const tree = renderer.create(<SubMenu
            currentMenuChoice={"option1"}
            options={List<MenuOption>([
                {
                    href: "go/to/option1",
                    key: "option1",
                    name: "first option"
                },
                {
                    href: "go/to/option2",
                    key: "option2",
                    name: "second option"
                }
            ])}
            text={"Test with two options"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("several options, one chosen", () => {
        const tree = renderer.create(<SubMenu
            currentMenuChoice={"option2"}
            options={List<MenuOption>([
                {
                    href: "go/to/option1",
                    key: "option1",
                    name: "first option"
                },
                {
                    href: "go/to/option2",
                    key: "option2",
                    name: "second option"
                },
                {
                    href: "go/to/option3",
                    key: "option3",
                    name: "third option"
                }
            ])}
            text={"Test with several options"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    })
});
