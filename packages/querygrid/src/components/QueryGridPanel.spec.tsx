/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'reactn';
import renderer from 'react-test-renderer'
import { List } from 'immutable'
import { QueryGridModel } from '@glass/base'

import { QueryGridPanel } from './QueryGridPanel'
import { initQueryGridState, updateQueryGridModel } from '../global'

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