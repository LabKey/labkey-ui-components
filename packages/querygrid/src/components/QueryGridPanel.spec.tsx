import React from 'reactn';
import renderer from 'react-test-renderer';
import {List, Map, fromJS} from 'immutable';

import { QueryGridPanel } from "./QueryGridPanel";
import { QueryGridModel } from "@glass/models/src";
import { initQueryGridState, updateQueryGridModel } from "../global";

const modelIsLoaded = new QueryGridModel({
    id: 'queryGridLoaded',
    isLoaded: true,
    title: 'First Query Grid'
});
const modelIsLoaded2 = new QueryGridModel({
    id: 'queryGridLoaded2',
    isLoaded: true,
    title: 'Second Query Grid'
});

beforeAll(() => {
    initQueryGridState();
    updateQueryGridModel(modelIsLoaded, {}, undefined, false);
    updateQueryGridModel(modelIsLoaded2, {}, undefined, false);
});

// Mock all the actions to test just the rendering parts for QueryGridPanel itself
jest.mock('../actions');

describe("QueryGridPanel render", () => {

    test("no model", () => {
        const tree = renderer.create(<QueryGridPanel model={null}/>).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test("loading", () => {
       const model = new QueryGridModel();
       const tree = renderer.create(<QueryGridPanel model={model}/>).toJSON();
       expect(tree).toMatchSnapshot();
    });

    test("query grid error", () => {
        const model = new QueryGridModel({
            id: 'queryGridError',
            isLoaded: true,
            isLoading: false,
            isError: true,
            message: 'My QueryGridModel error message.'
        });
        updateQueryGridModel(model, {}, undefined, false);

        const tree = renderer.create(<QueryGridPanel model={model}/>);
        expect(tree).toMatchSnapshot();
    });

    test("with header and message props", () => {
        const tree = renderer.create(<QueryGridPanel
            model={modelIsLoaded}
            header={<h4>look at this h4 header</h4>}
            message={<p>look at this paragraph message</p>}
            asPanel={false}
        />);
        expect(tree).toMatchSnapshot();
    });

    test("with showAllTabs and one empty grid tab (we never show tabs for single model)", () => {
        const tree = renderer.create(<QueryGridPanel
            model={modelIsLoaded}
            showAllTabs={true}
        />);
        expect(tree).toMatchSnapshot();
    });

    test("with showAllTabs and two empty grid tabs (both should show)", () => {
        const tree = renderer.create(<QueryGridPanel
            model={List<QueryGridModel>([modelIsLoaded, modelIsLoaded2])}
            showTabs={true}
            showAllTabs={true}
        />);
        expect(tree).toMatchSnapshot();
    });

    // TODO this requires mocking up the model queryInfo, viewInfo, columns
    // test("with showTabs and two grid tabs with one empty (should show only non-empty)", () => {
    //     const tree = renderer.create(<QueryGridPanel
    //         model={List<QueryGridModel>([modelIsLoaded, modelIsLoadedWithData])}
    //         showTabs={true}
    //         showAllTabs={true}
    //     />);
    //     expect(tree).toMatchSnapshot();
    // });

});