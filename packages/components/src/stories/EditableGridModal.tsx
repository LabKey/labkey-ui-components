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
import { boolean, text, withKnobs } from '@storybook/addon-knobs';

import { getStateQueryGridModel } from '../internal/models';

import './stories.scss';
import * as constants from '../test/data/constants';

import { List, Map } from 'immutable';

import { EditableGridModal } from '..';
import { gridInit } from '..';
import { EditableColumnMetadata } from '..';
import { EditableGridLoader } from '..';
import { SchemaQuery } from '..';

storiesOf('EditableGridModal', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const modelId = 'editableModal';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            loader: new EditableGridLoader(),
            editable: true,
        });
        return (
            <EditableGridModal
                model={model}
                allowRemove={boolean('Allow remove', false)}
                show={boolean('Show modal?', true)}
                title={text('Title', 'Editable modal')}
                onCancel={() => console.log('Cancel')}
                onSave={() => console.log('Save changes')}
                cancelText={text('Cancel text', undefined)}
                saveText={text('Save text', undefined)}
            />
        );
    })
    .add('with undeletable items', () => {
        const modelId = 'editableGridModalWithDeleteRestrictions';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });

        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
            loader: {
                fetch: () => {
                    return new Promise(resolve => {
                        resolve({
                            data: constants.GRID_DATA,
                            dataIds: constants.GRID_DATA.keySeq().toList(),
                        });
                    });
                },
            },
        });

        gridInit(model, true);

        let columnMetadata = Map<string, EditableColumnMetadata>();
        columnMetadata = columnMetadata.set('Delete', { toolTip: <span>Items in use cannot be deleted.</span> });

        return (
            <EditableGridModal
                columnMetadata={columnMetadata}
                show={true}
                title="Delete restrictions"
                onSave={() => console.log('Save changes')}
                onCancel={() => console.log('Cancel')}
                bordered={true}
                allowBulkRemove={false}
                allowRemove={true}
                notDeletable={List<any>(['2'])}
                model={model}
            />
        );
    });
