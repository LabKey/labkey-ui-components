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

import { List } from 'immutable';

import {
    QueryGridPanel,
    ManageDropdownButton,
    QueryGridModel,
    SchemaQuery,
    SelectionMenuItem,
    DataViewInfoTypes,
} from '..';
import { DataViewInfo, getStateQueryGridModel } from '../internal/models';

class QueryGridPanelWrapper extends React.Component {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id="storymanagebtn">
                    <SelectionMenuItem
                        id="storymenuitem"
                        text="Delete Samples"
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            );
        }
    };

    getQueryGridModel() {
        const modelId = 'gridPanelWithData';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixtures',
        });

        return getStateQueryGridModel(modelId, schemaQuery, { isPaged: true });
    }

    render() {
        // add marginTop so that we can see tooltips on the buttons
        return (
            <div style={{ marginTop: '20px' }}>
                <QueryGridPanel
                    model={this.getQueryGridModel()}
                    buttons={this.renderButtons}
                    highlightLastSelectedRow={boolean('Highlight last selection?', true)}
                />
            </div>
        );
    }
}

class QueryGridPanelPagingWrapper extends React.Component {
    getQueryGridModel() {
        const modelId = 'gridPanelWithPagingData';
        const schemaQuery = new SchemaQuery({
            schemaName: 'exp.data',
            queryName: 'mixturespaging',
        });

        return getStateQueryGridModel(modelId, schemaQuery, { isPaged: true });
    }

    render() {
        // add marginTop so that we can see tooltips on the buttons
        return (
            <div style={{ marginTop: '20px' }}>
                <QueryGridPanel
                    model={this.getQueryGridModel()}
                    highlightLastSelectedRow={boolean('Highlight last selection?', true)}
                />
            </div>
        );
    }
}

class QueryGridPanelWithMessagesWrapper extends React.Component {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id="storymanagebtn">
                    <SelectionMenuItem
                        id="storymenuitem"
                        text="Delete Samples"
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            );
        }
    };

    getQueryGridModel() {
        const modelId = 'gridPanelWithMessages';
        const schemaQuery = new SchemaQuery({
            schemaName: 'assay.General.Amino Acids',
            queryName: 'Runs',
        });

        return getStateQueryGridModel(modelId, schemaQuery);
    }

    render() {
        // add marginTop so that we can see tooltips on the buttons
        return (
            <div style={{ marginTop: '20px' }}>
                <QueryGridPanel model={this.getQueryGridModel()} buttons={this.renderButtons} />
            </div>
        );
    }
}

class QueryGridPanelWithImagesWrapper extends React.Component {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id="storymanagebtn">
                    <SelectionMenuItem
                        id="storymenuitem"
                        text="Delete Samples"
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            );
        }
    };

    getQueryGridModel() {
        const modelId = 'gridPanelWithMessages';
        const schemaQuery = new SchemaQuery({
            schemaName: 'assay.General.ImageFieldAssay',
            queryName: 'Runs',
        });

        return getStateQueryGridModel(modelId, schemaQuery);
    }

    render() {
        // add marginTop so that we can see tooltips on the buttons
        return (
            <div style={{ marginTop: '20px' }}>
                <QueryGridPanel model={this.getQueryGridModel()} buttons={this.renderButtons} />
            </div>
        );
    }
}

class QueryGridPanelWithRenamedColumnsWrapper extends React.Component {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id="storymanagebtn">
                    <SelectionMenuItem
                        id="storymenuitem"
                        text="Delete Samples"
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            );
        }
    };

    getQueryGridModel() {
        // This grid model has a default view that has different column metadata for the Title column, which renames
        // "Title" to "Experiment Title". This is used to reproduce Issue 38186.
        const modelId = 'gridPanelWithRenamedColumns';
        const schemaQuery = new SchemaQuery({
            schemaName: 'labbook',
            queryName: 'LabBookExperiment',
        });

        return getStateQueryGridModel(modelId, schemaQuery);
    }

    render() {
        // add marginTop so that we can see tooltips on the buttons
        return (
            <div style={{ marginTop: '20px' }}>
                <QueryGridPanel model={this.getQueryGridModel()} buttons={this.renderButtons} />
            </div>
        );
    }
}

class QueryGridPanelMultiTab extends React.Component<any, any> {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id="storymanagebtn">
                    <SelectionMenuItem
                        id="storymenuitem"
                        text="Delete Samples"
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            );
        }
    };

    getQueryGridModels() {
        return List<QueryGridModel>([
            getStateQueryGridModel(
                'gridPanelWithData',
                new SchemaQuery({
                    schemaName: 'exp.data',
                    queryName: 'mixtures',
                })
            ),
            getStateQueryGridModel(
                'gridPanelWithImages',
                new SchemaQuery({
                    schemaName: 'assay.General.ImageFieldAssay',
                    queryName: 'Runs',
                })
            ),
            getStateQueryGridModel(
                'gridPanelWithRenamedColumns',
                new SchemaQuery({
                    schemaName: 'labbook',
                    queryName: 'LabBookExperiment',
                })
            ),
        ]);
    }

    render() {
        // add marginTop so that we can see tooltips on the buttons
        return (
            <div style={{ marginTop: '20px' }}>
                <QueryGridPanel
                    showTabs={true}
                    model={this.getQueryGridModels()}
                    buttons={this.renderButtons}
                    rightTabs={List<string>(['Runs'])}
                />
            </div>
        );
    }
}

class QueryGridPanelWithSampleComparisonWrapper extends React.Component {
    onReportClicked = (chart: DataViewInfo) => {
        console.log('Chart Clicked!', chart);
        return chart.type !== DataViewInfoTypes.SampleComparison;
    };

    onCreateReportClicked = type => {
        console.log('Create Report', type);
    };

    getQueryGridModel() {
        const modelId = 'gridPanelWithSCR';
        const schemaQuery = new SchemaQuery({
            schemaName: 'assay.General.Amino Acids',
            queryName: 'Data',
        });

        return getStateQueryGridModel(modelId, schemaQuery);
    }

    render() {
        // add marginTop so that we can see tooltips on the buttons
        return (
            <div style={{ marginTop: '20px' }}>
                <QueryGridPanel
                    model={this.getQueryGridModel()}
                    showSampleComparisonReports={true}
                    onReportClicked={this.onReportClicked}
                    onCreateReportClicked={this.onCreateReportClicked}
                />
            </div>
        );
    }
}

storiesOf('QueryGridPanel', module)
    .addDecorator(withKnobs)
    .add('with data', () => {
        return <QueryGridPanelWrapper />;
    })
    .add('with paging', () => {
        return <QueryGridPanelPagingWrapper />;
    })
    .add('with messages', () => {
        return <QueryGridPanelWithMessagesWrapper />;
    })
    .add('with images', () => {
        return <QueryGridPanelWithImagesWrapper />;
    })
    .add('with renamed columns', () => {
        return <QueryGridPanelWithRenamedColumnsWrapper />;
    })
    .add('with multiple tabs', () => {
        return <QueryGridPanelMultiTab />;
    })
    .add('with showSampleComparisonReports', () => {
        return <QueryGridPanelWithSampleComparisonWrapper />;
    });
