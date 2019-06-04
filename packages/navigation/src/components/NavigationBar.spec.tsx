import * as React from 'react'
import renderer from 'react-test-renderer'
import { NavigationBar } from "./NavigationBar";

describe("<NavigationBar/>", () => {

    test("default props", () => {
        const component = (
            <NavigationBar model={null}/>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("with search box", () => {
        const component = (
            <NavigationBar model={null} showSearchBox={true}/>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

});