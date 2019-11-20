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
import * as React from 'react';
import { storiesOf } from "@storybook/react";
import { withKnobs } from '@storybook/addon-knobs'

import { QueryGridPanel } from "../components/QueryGridPanel";
import { getStateQueryGridModel } from "../models";
import './stories.scss'
import { ManageDropdownButton } from '../components/buttons/ManageDropdownButton';
import { QueryGridModel, SchemaQuery } from '../components/base/models/model';
import { SelectionMenuItem } from '../components/menus/SelectionMenuItem';

class QueryGridPanelWrapper extends React.Component {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id={'storymanagebtn'}>
                    <SelectionMenuItem
                        id={'storymenuitem'}
                        text={'Delete Samples'}
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            )
        }
    };

    getQueryGridModel() {
        const modelId = "gridPanelWithData";
        const schemaQuery = new SchemaQuery({
            schemaName: "exp.data",
            queryName: "mixtures"
        });

        return getStateQueryGridModel(modelId, schemaQuery, {});
    }

    render() {
        return <QueryGridPanel model={this.getQueryGridModel()} buttons={this.renderButtons} />;
    }
}

class QueryGridPanelWithMessagesWrapper extends React.Component {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id={'storymanagebtn'}>
                    <SelectionMenuItem
                        id={'storymenuitem'}
                        text={'Delete Samples'}
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            )
        }
    };

    getQueryGridModel() {
        const modelId = "gridPanelWithMessages";
        const schemaQuery = new SchemaQuery({
            schemaName: "assay.General.Amino Acids",
            queryName: "Runs"
        });

        return getStateQueryGridModel(modelId, schemaQuery, {});
    }

    render() {
        return <QueryGridPanel model={this.getQueryGridModel()} buttons={this.renderButtons} />;
    }
}

class QueryGridPanelWithImagesWrapper extends React.Component {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id={'storymanagebtn'}>
                    <SelectionMenuItem
                        id={'storymenuitem'}
                        text={'Delete Samples'}
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            )
        }
    };

    getQueryGridModel() {
        const modelId = "gridPanelWithMessages";
        const schemaQuery = new SchemaQuery({
            schemaName: "assay.General.ImageFieldAssay",
            queryName: "Runs"
        });

        return getStateQueryGridModel(modelId, schemaQuery, {});
    }

    render() {
        return <QueryGridPanel model={this.getQueryGridModel()} buttons={this.renderButtons} />;
    }
}

class QueryGridPanelWithRenamedColumnsWrapper extends React.Component {
    renderButtons = (model: QueryGridModel) => {
        if (model) {
            return (
                <ManageDropdownButton id={'storymanagebtn'}>
                    <SelectionMenuItem
                        id={'storymenuitem'}
                        text={'Delete Samples'}
                        onClick={() => console.log('onMenuItemClick')}
                        model={model}
                    />
                </ManageDropdownButton>
            )
        }
    };

    getQueryGridModel() {
        // This grid model has a default view that has different column metadata for the Title column, which renames
        // "Title" to "Experiment Title". This is used to reproduce Issue 38186.
        const modelId = "gridPanelWithRenamedColumns";
        const schemaQuery = new SchemaQuery({
            schemaName: "labbook",
            queryName: "LabBookExperiment"
        });

        return getStateQueryGridModel(modelId, schemaQuery, {});
    }

    render() {
        return <QueryGridPanel model={this.getQueryGridModel()} buttons={this.renderButtons} />;
    }
}

storiesOf('QueryGridPanel', module)
    .addDecorator(withKnobs)
    .add("with data", () => {
        return <QueryGridPanelWrapper/>;
    })
    .add("with messages", () => {
        return <QueryGridPanelWithMessagesWrapper/>;
    })
    .add("with images", () => {
        return <QueryGridPanelWithImagesWrapper/>;
    })
    .add("with renamed columns", () => {
        return <QueryGridPanelWithRenamedColumnsWrapper/>;
    });
