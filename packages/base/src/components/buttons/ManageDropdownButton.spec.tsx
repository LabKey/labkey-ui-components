import * as React from 'react'
import renderer from 'react-test-renderer'

import { ManageDropdownButton } from "./ManageDropdownButton";

describe("<ManageDropdownButton/>", () => {

    test("default props", () => {
        const component = (
            <ManageDropdownButton id={'jest-manage-1'}/>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("custom props", () => {
        const component = (
            <ManageDropdownButton id={'jest-manage-2'} collapsed={true} pullRight={true}/>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

});