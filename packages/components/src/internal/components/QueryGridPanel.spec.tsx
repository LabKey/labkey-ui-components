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
import React from 'react';
import renderer from 'react-test-renderer';
import { List } from 'immutable';

import { TESTS_ONLY_RESET_DOM_COUNT } from '../util/utils';

import { getStateQueryGridModel } from '../../..';
import { initUnitTestMocks, registerDefaultURLMappers, sleep } from '../testHelpers';

import { QueryGridModel, SchemaQuery } from '../../..';
import { QueryGridPanel } from '../../..';

beforeAll(() => {
    initUnitTestMocks();
    registerDefaultURLMappers();
});

describe('QueryGridPanel render', () => {
    beforeEach(() => {
        // Reset the DOM counter used to generate IDs. This way snapshot tests will produce the same output when run
        // as a test suite or individually.
        TESTS_ONLY_RESET_DOM_COUNT();
    });

    test('no model', () => {
        const tree = renderer.create(<QueryGridPanel model={null} />);
        expect(tree).toMatchSnapshot();
    });

    test('loading', () => {
        const modelId = 'gridPanelLoading';
        const schemaQuery = new SchemaQuery({
            schemaName: 'assay.General.Amino Acids',
            queryName: 'Data',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery);
        const tree = renderer.create(<QueryGridPanel model={model} />);
        expect(tree).toMatchSnapshot();
    });

    test('query grid error', async () => {
        const modelId = 'gridPanelError';
        const schemaQuery = new SchemaQuery({
            schemaName: 'i.dont.exist',
            queryName: 'shouldFourOhFour',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery);

        TESTS_ONLY_RESET_DOM_COUNT();
        const tree = renderer.create(<QueryGridPanel model={model} />);

        await sleep();

        expect(tree).toMatchSnapshot();
    });

    test('with header and message props', () => {
        const modelId = 'gridPanelHeaderAndMessageProps';
        const schemaQuery = new SchemaQuery({
            schemaName: 'assay.General.Amino Acids',
            queryName: 'Data',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery);
        const tree = renderer.create(
            <QueryGridPanel
                model={model}
                header={<h4>look at this h4 header</h4>}
                message={<p>look at this paragraph message</p>}
                asPanel={false}
            />
        );
        expect(tree).toMatchSnapshot();
    });

    test('with showAllTabs and one empty grid tab (we never show tabs for single model)', () => {
        const modelId = 'gridPanelWithSingleModelShowAllTabs';
        const schemaQuery = new SchemaQuery({
            schemaName: 'assay.General.ImageFieldAssay',
            queryName: 'Runs',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery);
        const tree = renderer.create(<QueryGridPanel model={model} showAllTabs={true} />);
        expect(tree).toMatchSnapshot();
    });

    test('with showAllTabs and two empty grid tabs (both should show)', () => {
        const modelId1 = 'gridPanelWithTabs1';
        const schemaQuery1 = new SchemaQuery({
            schemaName: 'assay.General.Amino Acids',
            queryName: 'Runs',
        });
        const model1 = getStateQueryGridModel(modelId1, schemaQuery1, { title: 'First Query Grid' });
        const modelId2 = 'gridPanelWithTabs2';
        const schemaQuery2 = new SchemaQuery({
            schemaName: 'assay.General.Amino Acids',
            queryName: 'Data',
        });
        const model2 = getStateQueryGridModel(modelId2, schemaQuery2, { title: 'Second Query Grid' });
        const models = List<QueryGridModel>([model1, model2]);
        const tree = renderer.create(<QueryGridPanel model={models} showTabs={true} showAllTabs={true} />);
        expect(tree).toMatchSnapshot();
    });

    test('with showTabs and two grid tabs with one empty (should show only non-empty)', async () => {
        const modelId1 = 'gridPanelWithTabsAndData';
        const schemaQuery1 = new SchemaQuery({
            schemaName: 'assay.General.GPAT 1',
            queryName: 'Runs',
        });
        const model1 = getStateQueryGridModel(modelId1, schemaQuery1, { title: 'First Query Grid' });
        const modelId2 = 'gridPanelWithTabsAndNoData';
        const schemaQuery2 = new SchemaQuery({
            schemaName: 'assay.General.GPAT 1',
            queryName: 'EmptyRuns',
        });
        const model2 = getStateQueryGridModel(modelId2, schemaQuery2, { title: 'Second Query Grid' });
        const models = List<QueryGridModel>([model1, model2]);
        const tree = renderer.create(<QueryGridPanel model={models} showTabs={true} />);

        await sleep();

        expect(tree).toMatchSnapshot();
    });
});
