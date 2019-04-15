import * as React from 'react';
import renderer from 'react-test-renderer'
import { LoadingPage } from "./LoadingPage";
import { shallow } from "enzyme";
import { PageHeader } from "./PageHeader";
import { LoadingSpinner } from "./LoadingSpinner";

describe("<LoadingPage/>", () => {
    test("no props", () => {
        const page = shallow(<LoadingPage/>);
        // make sure we include a header
        expect(page.find(PageHeader)).toHaveLength(1);
        // add the loading spinner
        expect(page.find(LoadingSpinner)).toHaveLength(1);
        expect(page).toMatchSnapshot();
    });

    test("Custom message and title", () => {
        const tree = renderer.create(<LoadingPage title={"Waiting room"} msg={"Wait here"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });
});