import * as React from 'react';
import { PageHeader } from "./PageHeader";
import renderer from 'react-test-renderer';

describe("<PageHeader />", () => {
    test("render without properties", () => {
        const tree = renderer.create(<PageHeader />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("render with icon", () => {
        const tree = renderer.create(<PageHeader icon="spinner"/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("render with title no icon", () => {
        const messageNode = <div className="special-class">A div message</div>;
        const tree = renderer.create(<PageHeader title={"Page title"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("render with icon and title", () => {
        const tree = renderer.create(<PageHeader title={"Page title"}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("render with children", () => {
        const tree = renderer.create(
            <PageHeader title={"reder with children"}>
                <div>Header text in the header</div>;
            </PageHeader>
        );
        expect(tree).toMatchSnapshot();
    })


});