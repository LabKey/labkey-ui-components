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
import { storiesOf } from '@storybook/react';
import { boolean, withKnobs } from '@storybook/addon-knobs';

import { QueryGrid } from '../internal/components/QueryGrid';
import { updateQueryGridModel } from '../global';
import { getStateQueryGridModel } from '../models';
import './stories.scss';
import { QueryGridModel, SchemaQuery } from '../internal/components/base/models/model';

storiesOf('QueryGrid', module)
    .addDecorator(withKnobs)
    .add('No data available', () => {
        const modelId = 'basicRendering';
        const schemaQuery = new SchemaQuery({
            schemaName: 'schema',
            queryName: 'q-snapshot',
        });
        const model = new QueryGridModel({
            allowSelection: boolean('allowSelection?', false),
            id: modelId,
            isLoaded: boolean('isLoaded?', true),
            isLoading: boolean('isLoading?', false),
            isError: boolean('isError?', false),
            schema: schemaQuery.schemaName,
            query: schemaQuery.queryName,
        });
        updateQueryGridModel(model, {}, undefined, false);
        return <QueryGrid model={model} schemaQuery={schemaQuery} />;
    })
    .add('without data', () => {
        const modelId = 'gridWithoutData';
        const schemaQuery = new SchemaQuery({
            schemaName: 'schema',
            queryName: 'gridWithoutData',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            allowSelection: false,
        });

        return <QueryGrid model={model} />;
    })
    .add('with data', () => {
        const modelId = 'gridWithData';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery);

        return <QueryGrid model={model} />;
    })
    .add('with message', () => {
        const modelId = 'gridWithMessage';
        const schemaQuery = new SchemaQuery({
            schemaName: 'assay.General.Amino Acids',
            queryName: 'Runs',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery);
        return <QueryGrid model={model} />;
    });
