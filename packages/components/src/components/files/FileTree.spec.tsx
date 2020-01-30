import {FilePreviewGrid} from "./FilePreviewGrid";
import {fromJS} from "immutable";
import renderer from "react-test-renderer";
import React from "react";
import {mount, shallow} from "enzyme";
import {AssayDesignerPanels, FileTree} from "../..";
import toJson from "enzyme-to-json";
import {fetchFileTestTree} from "./FileTreeTest";


describe("<FileTree/>", () => {

    const waitForLoad = jest.fn((component) => Promise.resolve(!component.state().loading));

    test("with data", () => {
        const tree = shallow(
            <FileTree loadData={fetchFileTestTree}/>
        );

        return waitForLoad(tree).then(() => {

            let node = tree.childAt(0).dive().childAt(0).dive().find('NodeHeader');
            expect(node.prop('node')['children'].length).toEqual(0);

            node.simulate('click');

            return waitForLoad(tree).then(() => {

                expect(node.prop('node')['children'].length).toEqual(4);
                expect(toJson(tree)).toMatchSnapshot();
                tree.unmount();
            });
        });
    });
});
