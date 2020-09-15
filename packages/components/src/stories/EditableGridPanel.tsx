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
import { boolean, number, select, text, withKnobs } from '@storybook/addon-knobs';
import { List, Map } from 'immutable';

import { gridInit } from '../actions';
import { getStateQueryGridModel } from '../models';
import { EditableGridPanel } from '../components/editable/EditableGridPanel';
import * as constants from '../test/data/constants';

import './stories.scss';
import { EditableColumnMetadata } from '../components/editable/EditableGrid';
import { SchemaQuery } from '../components/base/models/model';
import { PlacementType } from '../components/editable/Controls';
import { GridColumn } from '..';
import { GRID_EDIT_INDEX } from '../components/base/models/constants';

const CONTROLS_GROUP = 'Grid controls';
const PANEL_GROUP = 'Grid';

const CUSTOM_COUNT_COL = new GridColumn({
    index: GRID_EDIT_INDEX,
    tableCell: true,
    title: 'Location',
    width: 45,
    cell: (d, r, c, rn) => (
        <td className="cellular-count" key={c.index} style={{ textAlign: c.align || 'left' } as any}>
            <div className="cellular-count-static-content">Row: {rn}</div>
        </td>
    ),
});

storiesOf('EditableGridPanel', module)
    .addDecorator(withKnobs)
    .add('default properties', () => {
        const modelId = 'editableDefaultProps';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
        });
        return <EditableGridPanel model={model} />;
    })
    .add('with column tooltips', () => {
        const modelId = 'editableWithTooltips';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
        });
        let columnMetadata = Map<string, EditableColumnMetadata>();
        columnMetadata = columnMetadata.set('Name', { toolTip: 'Name tips' });
        columnMetadata = columnMetadata.set('mixtureTypeId', { toolTip: <b>We require this value</b> });
        columnMetadata = columnMetadata.set('Remove', {
            toolTip: (
                <span>
                    We allow you to remove things here. I <b>hope</b> that's what you expect.
                </span>
            ),
        });
        return (
            <EditableGridPanel
                model={model}
                allowRemove={true}
                removeColumnTitle="Remove"
                columnMetadata={columnMetadata}
            />
        );
    })
    .add('without data', () => {
        const modelId = 'editableWithoutData';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
        });

        const addRowsControl = {
            minCount: number('Minimum count', 1, {}, CONTROLS_GROUP),
            maxCount: number('Maximum count', 100, {}, CONTROLS_GROUP),
            nounPlural: text('Plural noun', 'rows', CONTROLS_GROUP),
            nounSingular: text('Singular noun', 'row', CONTROLS_GROUP),
            placement: select('Placement', ['top', 'bottom', 'both'], 'bottom', CONTROLS_GROUP),
        };

        const onRowCountChange = (count: number) => {
            console.log('Row count has changed to ' + count);
        };

        return (
            <EditableGridPanel
                addControlProps={addRowsControl}
                allowAdd={boolean('Allow rows to be added?', true, PANEL_GROUP)}
                allowBulkRemove={boolean('Allow bulk delete?', true, PANEL_GROUP)}
                allowRemove={boolean('Allow rows to be removed?', true, PANEL_GROUP)}
                disabled={boolean('Disabled?', false, PANEL_GROUP)}
                initialEmptyRowCount={number('Initial empty rows', 1, {}, PANEL_GROUP)}
                isSubmitting={boolean('Is submitting?', false, PANEL_GROUP)}
                title={text('Title', 'Grid title', PANEL_GROUP)}
                onRowCountChange={onRowCountChange}
                model={model}
                striped={boolean('Striped?', false, PANEL_GROUP)}
                bsStyle={text('bsStyle', undefined, PANEL_GROUP)}
                bordered={boolean('Bordered?', false, PANEL_GROUP)}
                condensed={boolean('Condensed?', true, PANEL_GROUP)}
                emptyGridMsg={text('Empty grid message', 'Add rows to start', PANEL_GROUP)}
                maxTotalRows={number('Max rows', undefined, {}, PANEL_GROUP)}
                rowNumColumn={boolean('Use custom row count column?', true, PANEL_GROUP) ? CUSTOM_COUNT_COL : undefined}
                hideCountCol={boolean('Hide count col?', false, PANEL_GROUP)}
                onCellModify={
                    boolean('onCellModifyFn?', false, PANEL_GROUP)
                        ? () => {
                              console.log('modified');
                          }
                        : undefined
                }
            />
        );
    })
    .add('with data', () => {
        const modelId = 'editableWithData';
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

        const addRowsControl = {
            minCount: number('Minimum to be added', 1, {}, CONTROLS_GROUP),
            maxCount: number('Maximum to be added', 100, {}, CONTROLS_GROUP),
            nounPlural: text('Plural noun', 'rows', CONTROLS_GROUP),
            nounSingular: text('Singular noun', 'row', CONTROLS_GROUP),
            placement: select('Placement', ['top', 'bottom', 'both'], 'bottom', CONTROLS_GROUP),
        };

        return (
            <EditableGridPanel
                addControlProps={addRowsControl}
                allowAdd={boolean('Allow rows to be added?', true, PANEL_GROUP)}
                bordered={boolean('Bordered?', false, PANEL_GROUP)}
                allowBulkRemove={boolean('Allow bulk delete?', true, PANEL_GROUP)}
                allowRemove={boolean('Allow rows to be removed?', true, PANEL_GROUP)}
                disabled={boolean('Disabled?', false, PANEL_GROUP)}
                isSubmitting={boolean('Is submitting?', false, PANEL_GROUP)}
                title={text('Title', 'Editable grid with data', PANEL_GROUP)}
                maxTotalRows={number('Max Rows Total', undefined, {}, CONTROLS_GROUP)}
                model={model}
                rowNumColumn={boolean('Use custom row count column?', true, PANEL_GROUP) ? CUSTOM_COUNT_COL : undefined}
                hideCountCol={boolean('Hide count col?', false, PANEL_GROUP)}
                readonlyRows={boolean('With readonly rows?', true, PANEL_GROUP) ? List<any>(['3']) : undefined}
                onCellModify={
                    boolean('onCellModifyFn?', false, PANEL_GROUP)
                        ? () => {
                              console.log('modified');
                          }
                        : undefined
                }
            />
        );
    })
    .add('with data and limited deletion', () => {
        const modelId = 'editableWithDataAndLimitedDeletion';
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
            <EditableGridPanel
                columnMetadata={columnMetadata}
                allowAdd={true}
                bordered={true}
                allowBulkRemove={false}
                allowRemove={true}
                notDeletable={List<any>(['2'])}
                model={model}
            />
        );
    })
    .add('with read-only columns and placeholders', () => {
        const modelId = 'editableWitReadOnlyAndPlaceHolders';
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

        const columnMetadata = Map<string, EditableColumnMetadata>({
            Name: {
                readOnly: boolean('Name field read-only?', true),
            },
            mixtureTypeId: {
                placeholder: text('Mixture Type placeholder text', 'Select a type...'),
            },
            extraTestColumn: {
                placeholder: text('Extra Test Column placeholder text', 'Enter text here'),
            },
        });

        return (
            <EditableGridPanel
                allowAdd={true}
                allowBulkRemove={true}
                allowRemove={true}
                columnMetadata={columnMetadata}
                disabled={false}
                model={model}
                isSubmitting={false}
                title="Editable grid with read-only data"
            />
        );
    })
    .add('with bulk edit', () => {
        const modelId = 'editableWithBulkEdit';
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

        const bulkAddProps = {
            header: text('Header for bulk insert', 'Create some mixture data here.'),
            title: text('Title for bulk import', 'Bulk creation of mixture data'),
        };

        return (
            <EditableGridPanel
                allowAdd={true}
                addControlProps={{ placement: text('Add control placement', 'bottom') as PlacementType }}
                allowBulkRemove={boolean('Allow bulk remove?', true)}
                bulkRemoveText={text('Bulk remove text', 'Delete Rows')}
                allowBulkAdd={boolean('Allow bulk add?', true)}
                bulkAddText={text('Bulk add text', 'Bulk Add')}
                allowBulkUpdate={boolean('Allow bulk update?', true)}
                bulkUpdateText={text('Bulk update text', 'Bulk Update')}
                model={model}
                isSubmitting={false}
                bulkAddProps={bulkAddProps}
                title="Editable grid with bulk insert capabilities"
            />
        );
    })
    .add('with quick add action', () => {
        const modelId = 'editableWithQuickAdd';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
        });

        const addRowsControl = {
            minCount: 1,
            maxCount: 1000,
            nounPlural: 'samples',
            nounSingular: 'sample',
            placement: 'top' as PlacementType,
            quickAddText: text('Quick add text', 'Add Ids and Finish'),
            onQuickAdd: (count: number) => {
                window.alert('Adding ' + count + (count === 1 ? ' sample.' : ' samples.'));
            },
        };

        const onRowCountChange = (count: number) => {
            console.log('Row count has changed to ' + count);
        };

        return (
            <EditableGridPanel
                addControlProps={addRowsControl}
                allowAdd={boolean('Allow rows to be added?', true, PANEL_GROUP)}
                allowBulkRemove={boolean('Allow bulk delete?', true, PANEL_GROUP)}
                allowRemove={boolean('Allow rows to be removed?', true, PANEL_GROUP)}
                disabled={boolean('Disabled?', false, PANEL_GROUP)}
                initialEmptyRowCount={number('Initial empty rows', 4, {}, PANEL_GROUP)}
                isSubmitting={boolean('Is submitting?', false, PANEL_GROUP)}
                title={text('Title', 'Grid title', PANEL_GROUP)}
                onRowCountChange={onRowCountChange}
                model={model}
            />
        );
    })
    .add('for update', () => {
        const modelId = 'editableForUpdate';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });
        const model = getStateQueryGridModel(modelId, schemaQuery, {
            editable: true,
        });

        return (
            <EditableGridPanel
                allowAdd={false}
                allowBulkRemove={false}
                allowRemove={true}
                forUpdate={true}
                readOnlyColumns={List<string>(['Name'])}
                title={text('Title', 'Grid title', PANEL_GROUP)}
                model={model}
            />
        );
    });
