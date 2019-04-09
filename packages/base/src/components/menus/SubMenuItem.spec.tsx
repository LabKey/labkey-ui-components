import * as React from 'react'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'

import { SubMenuItem } from './SubMenuItem'

const items = [
    {
        text: "item one",
        href: "go/to/item1",
        disabledMsg: "Not available",
    },
    {
        text: "item two",
        href: "go/to/item2",
        disabledMsg: "Also not available"
    },
    {
        text: "item three",
        href: "go/to/item3",
        disabledMsg: "Please try again"
    }
];

describe("<SubMenuItem />", () => {
    test("no properties render", () => {
        const tree = renderer.create(<SubMenuItem/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("with icon, text, and items", () => {
        const tree = renderer.create(<SubMenuItem
            icon={"star"}
            items={items}
            text={"test with items"}
        />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("with text, no items", () => {
        const tree = renderer.create(<SubMenuItem text={"test text"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("with text and items", () => {
        const tree = renderer.create(<SubMenuItem
            items={items}
            text={"test with items"}
        />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("disabled", () => {
        const menu = shallow(<SubMenuItem
            disabled={true}
            items={items}
            text={"disabled"}
        />);
        expect(menu.state()['expanded']).toBe(false);
        menu.find({role: 'menuitem'}).prop('onClick')();
        expect(menu.state()['expanded']).toBe(false);
        expect(menu).toMatchSnapshot();
    });

    test("allow filtering but not enough items", () => {
        const menu = shallow(<SubMenuItem
            allowFilter={true}
            minToFilter={items.length + 1}
            items={items}
            text={"Filtering below limit"}
        />);
        menu.find({role: 'menuitem'}).prop('onClick')();
        expect(menu.state()['expanded']).toBe(true);
        expect(menu.find({placeholder: "Filter..."})).toHaveLength(0);

        expect(menu).toMatchSnapshot();
    });

    test("allow filtering with more than enough items", () => {
        const menu = shallow(<SubMenuItem
            allowFilter={true}
            minToFilter={items.length - 1}
            items={items}
            text={"Filtering above limit"}
            filterPlaceholder={"Custom placeholder..."}
        />);
        menu.find({role: 'menuitem'}).prop('onClick')();
        expect(menu.state()['expanded']).toBe(true);
        expect(menu.find({placeholder: "Custom placeholder..."})).toHaveLength(1);

        expect(menu).toMatchSnapshot();
    });

    test("allow filtering with just enough items", () => {
        const menu = shallow(<SubMenuItem
            allowFilter={true}
            minToFilter={items.length}
            items={items}
            text={"Filtering at limit"}
            filterPlaceholder={"Filter..."}
        />);
        menu.find({role: 'menuitem'}).prop('onClick')();
        expect(menu.state()['expanded']).toBe(true);
        expect(menu.find({placeholder: "Filter..."})).toHaveLength(1);

        expect(menu).toMatchSnapshot();
    });

    test("onMouseOver", () => {
        const mouseOverFn = jest.fn();
        const menu = shallow(<SubMenuItem
            onMouseOver={mouseOverFn}
            items={items}
            text={"onMouseOver item"}
        />);
        menu.simulate('mouseover');
        expect(mouseOverFn).toHaveBeenCalledTimes(1);

        expect(menu).toMatchSnapshot();
    });

    test("onMouseOut", () => {
        const mouseOutFn = jest.fn();
        const menu = shallow(<SubMenuItem
            onMouseOut={mouseOutFn}
            items={items}
            text={"onMouseOut item"}
        />);
        // menu.simulate('mouseover');
        menu.simulate('mouseout');
        expect(mouseOutFn).toHaveBeenCalledTimes(1);

        expect(menu).toMatchSnapshot();
    });


});