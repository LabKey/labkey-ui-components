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

import { initQueryGridState, updateQueryGridModel } from '../global';

import { QueryGrid } from './QueryGrid';
import { QueryGridModel, SchemaQuery } from './base/models/model';

beforeAll(() => {
    initQueryGridState();
});

// Mock all the actions to test just the rendering parts for QueryGrid itself
jest.mock('../actions');

describe('QueryGrid render', () => {
    test('loading', () => {
        const schemaQuery = new SchemaQuery({
            schemaName: 'schema',
            queryName: 'q-snapshot',
        });
        const tree = renderer.create(<QueryGrid schemaQuery={schemaQuery} />).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('query grid error', () => {
        const modelId = 'queryGridError';
        const schemaQuery = new SchemaQuery({
            schemaName: 'schema',
            queryName: 'q-snapshot',
        });
        const model = new QueryGridModel({
            id: modelId,
            isLoaded: true,
            isLoading: false,
            isError: true,
            schema: schemaQuery.schemaName,
            query: schemaQuery.queryName,
        });
        updateQueryGridModel(model, {}, undefined, false);
        const tree = renderer.create(<QueryGrid model={model} schemaQuery={schemaQuery} />);
        expect(tree).toMatchSnapshot();
    });
});
